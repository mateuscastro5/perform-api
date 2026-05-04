import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GithubApiService } from './github-api.service';
import { GithubConfiguration } from './entities/github-configuration.entity';
import { MonitoredRepository } from './entities/monitored-repository.entity';
import { GithubCommit } from './entities/github-commit.entity';
import { GithubPullRequest } from './entities/github-pull-request.entity';
import { GithubPRReview } from './entities/github-pr-review.entity';
import { Developer } from '../developers/entities/developer.entity';

type RepositoryCollectionSummary = {
  commitsNew: number;
  prsCreated: number;
  prsUpdated: number;
  reviewsNew: number;
};

export type DataCollectionSummary = RepositoryCollectionSummary & {
  repositoriesTotal: number;
  repositoriesProcessed: number;
  errors: number;
  since: string;
  dataRangeMonths: number;
  durationMs: number;
};

@Injectable()
export class GithubDataCollectorService {
  private readonly logger = new Logger(GithubDataCollectorService.name);

  constructor(
    @InjectRepository(GithubConfiguration)
    private githubConfigRepository: Repository<GithubConfiguration>,
    @InjectRepository(MonitoredRepository)
    private monitoredRepoRepository: Repository<MonitoredRepository>,
    @InjectRepository(GithubCommit)
    private githubCommitRepository: Repository<GithubCommit>,
    @InjectRepository(GithubPullRequest)
    private githubPRRepository: Repository<GithubPullRequest>,
    @InjectRepository(GithubPRReview)
    private githubPRReviewRepository: Repository<GithubPRReview>,
    @InjectRepository(Developer)
    private developerRepository: Repository<Developer>,
    private githubApiService: GithubApiService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async collectAllRepositoriesData() {
    try {
      const configs = await this.githubConfigRepository.find({
        where: { isActive: true },
        relations: ['repositories'],
        select: ['id', 'userId', 'githubToken', 'dataRange'],
      });

      for (const config of configs) {
        await this.collectConfigurationData(config);
      }
    } catch (error) {
      this.logger.error('Error in automatic data collection:', error);
    }
  }

  async collectConfigurationData(
    config: GithubConfiguration,
  ): Promise<Omit<DataCollectionSummary, 'durationMs'>> {
    const since = this.calculateSinceDate(config.dataRange);
    const summary: Omit<DataCollectionSummary, 'durationMs'> = {
      repositoriesTotal: 0,
      repositoriesProcessed: 0,
      commitsNew: 0,
      prsCreated: 0,
      prsUpdated: 0,
      reviewsNew: 0,
      errors: 0,
      since,
      dataRangeMonths: config.dataRange,
    };

    for (const repo of config.repositories) {
      if (!repo.isActive) continue;

       summary.repositoriesTotal += 1;

      try {
        const repoSummary = await this.collectRepositoryData(
          config.githubToken,
          repo,
          since,
        );
        summary.repositoriesProcessed += 1;
        summary.commitsNew += repoSummary.commitsNew;
        summary.prsCreated += repoSummary.prsCreated;
        summary.prsUpdated += repoSummary.prsUpdated;
        summary.reviewsNew += repoSummary.reviewsNew;
      } catch (error) {
        summary.errors += 1;
        if (error?.response === 'Git Repository is empty.') {
          continue;
        }
        this.logger.error(
          `Error collecting data from ${repo.repoFullName}:`,
          error,
        );
      }
    }

    // Stamp the wall-clock time of this collection run so the dashboard
    // can render "synced N min ago". We touch even when 0 repos were
    // processed — the user still attempted a sync.
    try {
      await this.githubConfigRepository.update(
        { id: config.id },
        { lastSyncedAt: new Date() },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to stamp lastSyncedAt for config ${config.id}: ${err}`,
      );
    }

    return summary;
  }

  private async collectRepositoryData(
    token: string,
    repo: MonitoredRepository,
    since: string,
  ): Promise<RepositoryCollectionSummary> {
    const [owner, repoName] = repo.repoFullName.split('/');

    const commitsNew = await this.collectCommits(
      token,
      owner,
      repoName,
      repo.id,
      since,
    );
    const pullRequestSummary = await this.collectPullRequests(
      token,
      owner,
      repoName,
      repo.id,
      since,
    );

    return {
      commitsNew,
      prsCreated: pullRequestSummary.prsCreated,
      prsUpdated: pullRequestSummary.prsUpdated,
      reviewsNew: pullRequestSummary.reviewsNew,
    };
  }

  private async collectCommits(
    token: string,
    owner: string,
    repo: string,
    repositoryId: string,
    since: string,
  ): Promise<number> {
    let insertedCommits = 0;

    try {
      const commits = await this.githubApiService.listCommits(
        token,
        owner,
        repo,
        {
          since,
          perPage: 100,
        },
      );

      for (const commit of commits) {
        const existing = await this.githubCommitRepository.findOne({
          where: {
            repositoryId,
            commitSha: commit.sha,
          },
        });

        if (existing) continue;

        const developer = await this.findOrCreateDeveloper(
          commit.commit.author.email,
          commit.commit.author.name,
          commit.author?.login ?? null,
          commit.author?.avatar_url ?? null,
        );

        const githubCommit = this.githubCommitRepository.create({
          repositoryId,
          developerId: developer?.id || null,
          commitSha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          committedDate: new Date(commit.commit.author.date),
          additions: 0,
          deletions: 0,
          changedFiles: 0,
          branch: null,
          htmlUrl: commit.html_url,
        });

        await this.githubCommitRepository.save(githubCommit);
        insertedCommits += 1;
      }

      return insertedCommits;
    } catch (error) {
      if (error?.response === 'Git Repository is empty.') {
        return insertedCommits;
      }
      this.logger.error(`Error collecting commits:`, error);
      throw error;
    }
  }

  private async collectPullRequests(
    token: string,
    owner: string,
    repo: string,
    repositoryId: string,
    since: string,
  ): Promise<{ prsCreated: number; prsUpdated: number; reviewsNew: number }> {
    let prsCreated = 0;
    let prsUpdated = 0;
    let reviewsNew = 0;

    try {
      const prs = await this.githubApiService.listPullRequests(
        token,
        owner,
        repo,
        {
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          perPage: 100,
        },
      );

      const sinceDate = new Date(since);
      const filteredPRs = prs.filter((pr) => {
        const referenceDate = pr.updated_at ?? pr.created_at;
        return new Date(referenceDate) >= sinceDate;
      });

      for (const pr of filteredPRs) {
        let existingPR = await this.githubPRRepository.findOne({
          where: {
            repositoryId,
            prNumber: pr.number,
          },
        });

        const developer = await this.findDeveloperByGithubLogin(pr.user.login, pr.user.avatar_url);

        if (existingPR) {
          existingPR.state = pr.state;
          existingPR.title = pr.title;
          existingPR.body = pr.body;
          existingPR.prUpdatedAt = new Date(pr.updated_at);
          existingPR.closedAt = pr.closed_at ? new Date(pr.closed_at) : null;
          existingPR.mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;

          await this.githubPRRepository.save(existingPR);
          prsUpdated += 1;
        } else {
          const prDetails = await this.githubApiService.getPullRequest(
            token,
            owner,
            repo,
            pr.number,
          );

          const githubPR = this.githubPRRepository.create({
            repositoryId,
            developerId: developer?.id || null,
            prNumber: pr.number,
            title: pr.title,
            body: pr.body,
            state: pr.state,
            authorLogin: pr.user.login,
            authorEmail: null,
            prCreatedAt: new Date(pr.created_at),
            prUpdatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            additions: prDetails.additions,
            deletions: prDetails.deletions,
            changedFiles: prDetails.changed_files,
            commitsCount: prDetails.commits,
            commentsCount: prDetails.comments,
            reviewCommentsCount: prDetails.review_comments,
            htmlUrl: pr.html_url,
            baseBranch: pr.base.ref,
            headBranch: pr.head.ref,
          });

          existingPR = await this.githubPRRepository.save(githubPR);
          prsCreated += 1;
        }

        reviewsNew += await this.collectPRReviews(
          token,
          owner,
          repo,
          pr.number,
          existingPR.id,
        );
      }

      return { prsCreated, prsUpdated, reviewsNew };
    } catch (error) {
      this.logger.error(`Error collecting PRs:`, error);
      throw error;
    }
  }

  private async collectPRReviews(
    token: string,
    owner: string,
    repo: string,
    prNumber: number,
    pullRequestId: string,
  ): Promise<number> {
    let insertedReviews = 0;

    try {
      const reviews = await this.githubApiService.listPullRequestReviews(
        token,
        owner,
        repo,
        prNumber,
      );

      for (const review of reviews) {
        const existing = await this.githubPRReviewRepository.findOne({
          where: {
            pullRequestId,
            reviewId: review.id.toString(),
          },
        });

        if (existing) continue;

        const developer = await this.findDeveloperByGithubLogin(
          review.user.login,
          review.user.avatar_url,
        );

        const githubReview = this.githubPRReviewRepository.create({
          pullRequestId,
          developerId: developer?.id || null,
          reviewId: review.id.toString(),
          reviewerLogin: review.user.login,
          reviewerEmail: null,
          state: review.state,
          body: review.body,
          submittedAt: new Date(review.submitted_at),
          htmlUrl: review.html_url,
        });

        await this.githubPRReviewRepository.save(githubReview);
        insertedReviews += 1;
      }

      return insertedReviews;
    } catch (error) {
      this.logger.error(`Error collecting reviews for PR #${prNumber}:`, error);
      return insertedReviews;
    }
  }

  private async findOrCreateDeveloper(
    email: string,
    name: string,
    githubLogin: string | null,
    avatarUrl: string | null,
  ): Promise<Developer | null> {
    try {
      let developer: Developer | null = null;

      // 1. Primary lookup: by GitHub login (most reliable identifier)
      if (githubLogin) {
        developer = await this.developerRepository.findOne({
          where: { githubUsername: githubLogin },
        });
      }

      // 2. Fallback: lookup by email
      if (!developer) {
        developer = await this.developerRepository.findOne({
          where: { email },
        });

        // If found by email but has wrong githubUsername, update it
        if (developer && githubLogin && developer.githubUsername !== githubLogin) {
          developer.githubUsername = githubLogin;
          developer.githubId = githubLogin;
          if (avatarUrl && !developer.avatarUrl) {
            developer.avatarUrl = avatarUrl;
          }
          developer = await this.developerRepository.save(developer);
        }
      }

      // 3. Create new developer if not found
      if (!developer) {
        developer = new Developer();
        developer.githubId = githubLogin || email;
        developer.name = name;
        developer.email = email;
        developer.githubUsername = githubLogin || email;
        developer.avatarUrl = avatarUrl;
        developer.profileUrl = githubLogin
          ? `https://github.com/${githubLogin}`
          : null;
        developer.active = true;

        developer = await this.developerRepository.save(developer);
      } else {
        // Update avatar and name if missing
        let needsUpdate = false;
        if (avatarUrl && !developer.avatarUrl) {
          developer.avatarUrl = avatarUrl;
          needsUpdate = true;
        }
        if (name && developer.name === developer.githubUsername) {
          developer.name = name;
          needsUpdate = true;
        }
        if (needsUpdate) {
          developer = await this.developerRepository.save(developer);
        }
      }

      return developer;
    } catch (error) {
      this.logger.error(`Error finding/creating developer ${email}:`, error);
      return null;
    }
  }

  private async findDeveloperByGithubLogin(
    githubLogin: string,
    avatarUrl?: string | null,
  ): Promise<Developer | null> {
    try {
      const developer = await this.developerRepository.findOne({
        where: { githubUsername: githubLogin },
      });

      if (!developer) {
        const newDev = new Developer();
        newDev.githubId = githubLogin;
        newDev.name = githubLogin;
        newDev.email = `${githubLogin}@github.com`;
        newDev.githubUsername = githubLogin;
        newDev.avatarUrl = avatarUrl || null;
        newDev.profileUrl = `https://github.com/${githubLogin}`;
        newDev.active = true;

        return await this.developerRepository.save(newDev);
      }

      // Update avatar if missing
      if (avatarUrl && !developer.avatarUrl) {
        developer.avatarUrl = avatarUrl;
        return await this.developerRepository.save(developer);
      }

      return developer;
    } catch (error) {
      this.logger.error(
        `Error finding developer by GitHub login ${githubLogin}:`,
        error,
      );
      return null;
    }
  }

  private calculateSinceDate(dataRange: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - dataRange);
    return date.toISOString();
  }

  async mergeAndCleanupDevelopers(): Promise<{
    merged: number;
    deleted: number;
    details: string[];
  }> {
    const details: string[] = [];
    let merged = 0;
    let deleted = 0;

    // Find all developers that were created from commits (github_id = email pattern)
    // These have githubUsername = display name instead of login
    const allDevs = await this.developerRepository.find();

    // Group: login-based devs (from PRs) have email like "login@github.com"
    // Email-based devs (from commits) have real emails
    const loginDevs = allDevs.filter(
      (d) => d.email?.endsWith('@github.com') && !d.email.includes('+'),
    );
    const emailDevs = allDevs.filter(
      (d) => !d.email?.endsWith('@github.com') || d.email.includes('+'),
    );

    for (const loginDev of loginDevs) {
      // Find commit-based duplicates: developers whose githubUsername looks like
      // a display name (has spaces or doesn't match a login pattern)
      // We match by checking if commits from emailDev are from the same person
      const commitsByLoginDev = await this.githubCommitRepository.count({
        where: { developerId: loginDev.id },
      });

      // This login-based dev might already have commits (if properly linked)
      // Look for email-based devs that could be the same person
      for (const emailDev of emailDevs) {
        if (emailDev.id === loginDev.id) continue;

        // Check if any commits by emailDev have author matching loginDev's username
        const matchingCommits = await this.githubCommitRepository
          .createQueryBuilder('c')
          .where('c.developer_id = :devId', { devId: emailDev.id })
          .andWhere(
            '(LOWER(c.author_name) = LOWER(:login) OR LOWER(c.author_name) = LOWER(:name))',
            { login: loginDev.githubUsername, name: emailDev.name },
          )
          .getCount();

        // Also check: does the emailDev's githubUsername match the loginDev's name or vice versa?
        const nameMatchesLogin =
          emailDev.githubUsername?.toLowerCase() ===
            loginDev.name?.toLowerCase() ||
          emailDev.name?.toLowerCase() === loginDev.name?.toLowerCase() ||
          emailDev.name?.toLowerCase() ===
            loginDev.githubUsername?.toLowerCase();

        if (matchingCommits > 0 || nameMatchesLogin) {
          // Merge: reassign all data from emailDev to loginDev
          await this.githubCommitRepository
            .createQueryBuilder()
            .update()
            .set({ developerId: loginDev.id })
            .where('developer_id = :oldId', { oldId: emailDev.id })
            .execute();

          await this.githubPRRepository
            .createQueryBuilder()
            .update()
            .set({ developerId: loginDev.id })
            .where('developer_id = :oldId', { oldId: emailDev.id })
            .execute();

          await this.githubPRReviewRepository
            .createQueryBuilder()
            .update()
            .set({ developerId: loginDev.id })
            .where('developer_id = :oldId', { oldId: emailDev.id })
            .execute();

          // Update canonical record with best data
          if (
            emailDev.name &&
            emailDev.name !== emailDev.email &&
            emailDev.name.includes(' ')
          ) {
            loginDev.name = emailDev.name; // Prefer full name with spaces
          }
          if (
            emailDev.email &&
            !emailDev.email.endsWith('@github.com')
          ) {
            loginDev.email = emailDev.email; // Prefer real email
          }
          if (emailDev.avatarUrl && !loginDev.avatarUrl) {
            loginDev.avatarUrl = emailDev.avatarUrl;
          }

          await this.developerRepository.save(loginDev);

          // Delete the duplicate
          await this.developerRepository.remove(emailDev);

          details.push(
            `Merged "${emailDev.name}" (${emailDev.email}) → "${loginDev.githubUsername}" (${loginDev.id})`,
          );
          merged++;
        }
      }
    }

    // Also merge email-based devs that are duplicates of each other
    // (e.g., same person with multiple commit emails)
    // This is handled by the fixed findOrCreateDeveloper going forward

    // Delete seed/demo developers (hardcoded UUIDs from seed data)
    const seedIds = [
      'd1111111-1111-1111-1111-111111111111',
      'd2222222-2222-2222-2222-222222222222',
      'd3333333-3333-3333-3333-333333333333',
      'd4444444-4444-4444-4444-444444444444',
      'd5555555-5555-5555-5555-555555555555',
      'd6666666-6666-6666-6666-666666666666',
      'd7777777-7777-7777-7777-777777777777',
      'd8888888-8888-8888-8888-888888888888',
    ];

    for (const seedId of seedIds) {
      const seedDev = await this.developerRepository.findOne({
        where: { id: seedId },
      });
      if (seedDev) {
        // Reassign any data to null before deleting
        await this.githubCommitRepository
          .createQueryBuilder()
          .update()
          .set({ developerId: null as any })
          .where('developer_id = :id', { id: seedId })
          .execute();
        await this.githubPRRepository
          .createQueryBuilder()
          .update()
          .set({ developerId: null as any })
          .where('developer_id = :id', { id: seedId })
          .execute();
        await this.githubPRReviewRepository
          .createQueryBuilder()
          .update()
          .set({ developerId: null as any })
          .where('developer_id = :id', { id: seedId })
          .execute();

        await this.developerRepository.remove(seedDev);
        details.push(`Deleted seed developer: "${seedDev.name}" (${seedId})`);
        deleted++;
      }
    }

    return { merged, deleted, details };
  }

  async forceCollectForUser(userId: string): Promise<DataCollectionSummary> {
    const startedAt = Date.now();

    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      relations: ['repositories'],
      select: ['id', 'userId', 'githubToken', 'dataRange'],
    });

    if (!config) {
      throw new Error('GitHub configuration not found');
    }

    const summary = await this.collectConfigurationData(config);

    return {
      ...summary,
      durationMs: Date.now() - startedAt,
    };
  }
}
