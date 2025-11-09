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

  async collectConfigurationData(config: GithubConfiguration): Promise<void> {
    const since = this.calculateSinceDate(config.dataRange);

    for (const repo of config.repositories) {
      if (!repo.isActive) continue;

      try {
        await this.collectRepositoryData(config.githubToken, repo, since);
      } catch (error) {
        if (error?.response === 'Git Repository is empty.') {
          continue;
        }
        this.logger.error(
          `Error collecting data from ${repo.repoFullName}:`,
          error,
        );
      }
    }
  }

  private async collectRepositoryData(
    token: string,
    repo: MonitoredRepository,
    since: string,
  ): Promise<void> {
    const [owner, repoName] = repo.repoFullName.split('/');

    await this.collectCommits(token, owner, repoName, repo.id, since);
    await this.collectPullRequests(token, owner, repoName, repo.id, since);
  }

  private async collectCommits(
    token: string,
    owner: string,
    repo: string,
    repositoryId: string,
    since: string,
  ): Promise<void> {
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
      }
    } catch (error) {
      if (error?.response === 'Git Repository is empty.') {
        return;
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
  ): Promise<void> {
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

      const filteredPRs = prs.filter(
        (pr) => new Date(pr.created_at) >= new Date(since),
      );

      for (const pr of filteredPRs) {
        let existingPR = await this.githubPRRepository.findOne({
          where: {
            repositoryId,
            prNumber: pr.number,
          },
        });

        const developer = await this.findDeveloperByGithubLogin(pr.user.login);

        if (existingPR) {
          existingPR.state = pr.state;
          existingPR.title = pr.title;
          existingPR.body = pr.body;
          existingPR.prUpdatedAt = new Date(pr.updated_at);
          existingPR.closedAt = pr.closed_at ? new Date(pr.closed_at) : null;
          existingPR.mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;

          await this.githubPRRepository.save(existingPR);
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
        }

        await this.collectPRReviews(
          token,
          owner,
          repo,
          pr.number,
          existingPR.id,
        );
      }
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
  ): Promise<void> {
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
      }
    } catch (error) {
      this.logger.error(`Error collecting reviews for PR #${prNumber}:`, error);
    }
  }

  private async findOrCreateDeveloper(
    email: string,
    name: string,
  ): Promise<Developer | null> {
    try {
      let developer = await this.developerRepository.findOne({
        where: { email },
      });

      if (!developer) {
        developer = new Developer();
        developer.githubId = email;
        developer.name = name;
        developer.email = email;
        developer.githubUsername = name;
        developer.avatarUrl = null;
        developer.profileUrl = null;
        developer.active = true;

        developer = await this.developerRepository.save(developer);
      }

      return developer;
    } catch (error) {
      this.logger.error(`Error finding/creating developer ${email}:`, error);
      return null;
    }
  }

  private async findDeveloperByGithubLogin(
    githubLogin: string,
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
        newDev.avatarUrl = null;
        newDev.profileUrl = null;
        newDev.active = true;

        return await this.developerRepository.save(newDev);
      }

      return developer;
    } catch (error) {
      this.logger.error(
        `  ❌ Erro ao encontrar developer por GitHub login ${githubLogin}:`,
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

  async forceCollectForUser(userId: string): Promise<void> {
    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      relations: ['repositories'],
      select: ['id', 'userId', 'githubToken', 'dataRange'],
    });

    if (!config) {
      throw new Error('GitHub configuration not found');
    }

    await this.collectConfigurationData(config);
  }
}
