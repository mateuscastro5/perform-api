import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { GithubCommit } from './entities/github-commit.entity';
import { GithubPullRequest } from './entities/github-pull-request.entity';
import { GithubPRReview } from './entities/github-pr-review.entity';
import { MonitoredRepository } from './entities/monitored-repository.entity';
import { Developer } from '../developers/entities/developer.entity';

@Injectable()
export class GithubAnalyticsService {
  private readonly logger = new Logger(GithubAnalyticsService.name);

  constructor(
    @InjectRepository(GithubCommit)
    private githubCommitRepository: Repository<GithubCommit>,
    @InjectRepository(GithubPullRequest)
    private githubPRRepository: Repository<GithubPullRequest>,
    @InjectRepository(GithubPRReview)
    private githubPRReviewRepository: Repository<GithubPRReview>,
    @InjectRepository(MonitoredRepository)
    private monitoredRepoRepository: Repository<MonitoredRepository>,
    @InjectRepository(Developer)
    private developerRepository: Repository<Developer>,
  ) {}

  async getDashboardStats(userId: string, days = 30, repositoryId?: string) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return this.getEmptyStats();
    }

    const repoIds = repos.map((r) => r.id);

    const totalCommits = await this.githubCommitRepository.count({
      where: {
        repositoryId: In(repoIds),
        committedDate: MoreThanOrEqual(since),
      },
    });

    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    const commitsThisWeek = await this.githubCommitRepository.count({
      where: {
        repositoryId: In(repoIds),
        committedDate: MoreThanOrEqual(lastWeekDate),
      },
    });

    const twoWeeksAgoDate = new Date();
    twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);

    const commitsLastWeek = await this.githubCommitRepository.count({
      where: {
        repositoryId: In(repoIds),
        committedDate: MoreThanOrEqual(twoWeeksAgoDate),
      },
    });

    const openPRs = await this.githubPRRepository.count({
      where: {
        repositoryId: In(repoIds),
        state: 'open',
      },
    });

    const mergedPRsThisWeek = await this.githubPRRepository.count({
      where: {
        repositoryId: In(repoIds),
        state: 'closed',
        mergedAt: MoreThanOrEqual(lastWeekDate),
      },
    });

    const closedPRs = await this.githubPRRepository.count({
      where: {
        repositoryId: In(repoIds),
        state: 'closed',
      },
    });

    const totalReviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.pullRequest', 'pr')
      .where('pr.repositoryId IN (:...repoIds)', { repoIds })
      .getCount();

    const approvedReviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.pullRequest', 'pr')
      .where('pr.repositoryId IN (:...repoIds)', { repoIds })
      .andWhere('review.state = :state', { state: 'APPROVED' })
      .getCount();

    const changesRequestedReviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.pullRequest', 'pr')
      .where('pr.repositoryId IN (:...repoIds)', { repoIds })
      .andWhere('review.state = :state', { state: 'CHANGES_REQUESTED' })
      .getCount();

    const commitsPercentageChange =
      commitsLastWeek === 0
        ? 100
        : ((commitsThisWeek - commitsLastWeek) / commitsLastWeek) * 100;

    return {
      commits: {
        total: totalCommits,
        thisWeek: commitsThisWeek,
        lastWeek: commitsLastWeek,
        percentageChange: Math.round(commitsPercentageChange * 10) / 10,
      },
      pullRequests: {
        total: openPRs + closedPRs,
        open: openPRs,
        closed: closedPRs,
        merged: mergedPRsThisWeek,
        awaitingReview: openPRs,
      },
      reviews: {
        total: totalReviews,
        approved: approvedReviews,
        changesRequested: changesRequestedReviews,
        pending: openPRs,
      },
      period: {
        days,
        since: since.toISOString(),
      },
    };
  }

  async getWeeklyActivity(userId: string, repositoryId?: string) {
    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return this.getEmptyWeeklyActivity();
    }

    const repoIds = repos.map((r) => r.id);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const weeklyData: Array<{ day: string; commits: number; date: string }> =
      [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const commits = await this.githubCommitRepository
        .createQueryBuilder('commit')
        .where('commit.repository_id IN (:...repoIds)', { repoIds })
        .andWhere('commit.committed_date >= :startDate', { startDate: date })
        .andWhere('commit.committed_date < :endDate', { endDate: nextDate })
        .getCount();

      weeklyData.push({
        day: weekDays[date.getDay()],
        commits,
        date: date.toISOString().split('T')[0],
      });
    }

    return {
      data: weeklyData,
      total: weeklyData.reduce((sum, d) => sum + d.commits, 0),
      average:
        Math.round(
          (weeklyData.reduce((sum, d) => sum + d.commits, 0) / 7) * 10,
        ) / 10,
    };
  }

  async getCollaborationMetrics(userId: string, repositoryId?: string) {
    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
      relations: ['configuration'],
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return { developers: [], interactions: [] };
    }

    const repoIds = repos.map((r) => r.id);

    const developers = await this.developerRepository
      .createQueryBuilder('dev')
      .innerJoin(GithubCommit, 'commit', 'commit.developer_id = dev.id')
      .where('commit.repository_id IN (:...repoIds)', { repoIds })
      .orWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('pr.developer_id')
          .from(GithubPullRequest, 'pr')
          .where('pr.repository_id IN (:...repoIds)', { repoIds })
          .getQuery();
        return 'dev.id IN ' + subQuery;
      })
      .groupBy('dev.id')
      .getMany();

    const reviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.pullRequest', 'pr')
      .innerJoinAndSelect('review.developer', 'reviewer')
      .innerJoinAndSelect('pr.developer', 'author')
      .where('pr.repositoryId IN (:...repoIds)', { repoIds })
      .getMany();

    const interactions: Array<{
      from: string;
      to: string;
      count: number;
    }> = [];

    reviews.forEach((review) => {
      if (!review.developer || !review.pullRequest.developer) return;

      const from = review.developer.name;
      const to = review.pullRequest.developer.name;

      const existing = interactions.find((i) => i.from === from && i.to === to);
      if (existing) {
        existing.count++;
      } else {
        interactions.push({ from, to, count: 1 });
      }
    });

    return {
      developers: developers.map((d) => ({
        id: d.id,
        name: d.name,
        githubUsername: d.githubUsername,
        avatarUrl: d.avatarUrl,
      })),
      interactions,
      totalReviews: reviews.length,
    };
  }

  async getDeveloperStats(userId: string, developerId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repos.length === 0) {
      return this.getEmptyDeveloperStats();
    }

    const repoIds = repos.map((r) => r.id);

    const commits = await this.githubCommitRepository.count({
      where: {
        developerId,
        repositoryId: In(repoIds),
        committedDate: MoreThanOrEqual(since),
      },
    });

    const prs = await this.githubPRRepository.count({
      where: {
        developerId,
        repositoryId: In(repoIds),
      },
    });

    const reviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.pullRequest', 'pr')
      .where('review.developerId = :developerId', { developerId })
      .andWhere('pr.repositoryId IN (:...repoIds)', { repoIds })
      .getCount();

    const mergedPRs = await this.githubPRRepository.count({
      where: {
        developerId,
        repositoryId: In(repoIds),
        state: 'closed',
        mergedAt: MoreThanOrEqual(since),
      },
    });

    return {
      commits,
      pullRequests: prs,
      reviews,
      mergedPRs,
      period: {
        days,
        since: since.toISOString(),
      },
    };
  }

  async getAllDevelopersWithStats(
    userId: string,
    days = 30,
    repositoryId?: string,
  ) {
    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return [];
    }

    const repoIds = repos.map((r) => r.id);

    const developers = await this.developerRepository
      .createQueryBuilder('dev')
      .leftJoin(GithubCommit, 'commit', 'commit.developer_id = dev.id')
      .leftJoin(GithubPullRequest, 'pr', 'pr.developer_id = dev.id')
      .where('commit.repository_id IN (:...repoIds)', { repoIds })
      .orWhere('pr.repository_id IN (:...repoIds)', { repoIds })
      .groupBy('dev.id')
      .getMany();

    const developersWithStats = await Promise.all(
      developers.map(async (dev) => {
        const stats = await this.getDeveloperStats(userId, dev.id, days);

        const devRepos = await this.monitoredRepoRepository
          .createQueryBuilder('repo')
          .leftJoin(GithubCommit, 'commit', 'commit.repository_id = repo.id')
          .leftJoin(GithubPullRequest, 'pr', 'pr.repository_id = repo.id')
          .where('repo.id IN (:...repoIds)', { repoIds })
          .andWhere(
            '(commit.developer_id = :devId OR pr.developer_id = :devId)',
            { devId: dev.id },
          )
          .groupBy('repo.id')
          .getMany();

        return {
          id: dev.id,
          name: dev.name,
          githubUsername: dev.githubUsername,
          email: dev.email,
          avatarUrl: dev.avatarUrl,
          stats,
          repositories: devRepos.map((repo) => ({
            id: repo.id,
            name: repo.repoName,
            fullName: repo.repoFullName,
          })),
        };
      }),
    );

    return developersWithStats;
  }

  async getMonitoredRepositories(userId: string) {
    const repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
      order: {
        repoFullName: 'ASC',
      },
    });

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.repoName,
      fullName: repo.repoFullName,
      isActive: repo.isActive,
    }));
  }

  async getTopReviewers(userId: string, limit = 10) {
    const repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repos.length === 0) {
      return [];
    }

    const repoIds = repos.map((r) => r.id);

    const prs = await this.githubPRRepository.find({
      where: { repositoryId: In(repoIds) },
      select: ['id'],
    });

    if (prs.length === 0) {
      return [];
    }

    const prIds = prs.map((pr) => pr.id);

    const reviewStats = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .select('review.reviewer_login', 'reviewerLogin')
      .addSelect('COUNT(DISTINCT review.pull_request_id)', 'prsReviewed')
      .addSelect('COUNT(*)', 'totalReviews')
      .addSelect(
        "SUM(CASE WHEN review.state = 'APPROVED' THEN 1 ELSE 0 END)",
        'approved',
      )
      .addSelect(
        "SUM(CASE WHEN review.state = 'CHANGES_REQUESTED' THEN 1 ELSE 0 END)",
        'changesRequested',
      )
      .addSelect(
        "SUM(CASE WHEN review.state = 'COMMENTED' THEN 1 ELSE 0 END)",
        'commented',
      )
      .leftJoin('review.developer', 'developer')
      .addSelect('developer.id', 'developerId')
      .addSelect('developer.name', 'developerName')
      .addSelect('developer.avatar_url', 'avatarUrl')
      .where('review.pull_request_id IN (:...prIds)', { prIds })
      .groupBy('review.reviewer_login')
      .addGroupBy('developer.id')
      .addGroupBy('developer.name')
      .addGroupBy('developer.avatar_url')
      .orderBy('"prsReviewed"', 'DESC')
      .limit(limit)
      .getRawMany();

    return reviewStats.map((stat: any) => ({
      reviewer: {
        id: stat.developerId || null,
        name: stat.developerName || stat.reviewerLogin,
        login: stat.reviewerLogin,
        avatar:
          stat.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(stat.reviewerLogin)}&background=random`,
      },
      stats: {
        prsReviewed: parseInt(stat.prsReviewed),
        totalReviews: parseInt(stat.totalReviews),
        approved: parseInt(stat.approved),
        changesRequested: parseInt(stat.changesRequested),
        commented: parseInt(stat.commented),
      },
    }));
  }

  async getReviewerPullRequests(userId: string, reviewerLogin: string) {
    const repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repos.length === 0) {
      return { approved: [], changesRequested: [], commented: [], pending: [] };
    }

    const repoIds = repos.map((r) => r.id);

    const reviews = await this.githubPRReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.pullRequest', 'pr')
      .leftJoinAndSelect('pr.developer', 'developer')
      .where('pr.repository_id IN (:...repoIds)', { repoIds })
      .andWhere('review.reviewer_login = :reviewerLogin', { reviewerLogin })
      .orderBy('review.submittedAt', 'DESC')
      .getMany();

    const prReviewsMap = new Map<string, any>();
    reviews.forEach((review) => {
      const prId = review.pullRequestId;
      if (
        !prReviewsMap.has(prId) ||
        new Date(review.submittedAt) >
          new Date(prReviewsMap.get(prId)!.submittedAt)
      ) {
        prReviewsMap.set(prId, review);
      }
    });

    const categorized = {
      approved: [] as any[],
      changesRequested: [] as any[],
      commented: [] as any[],
      pending: [] as any[],
    };

    prReviewsMap.forEach((review) => {
      const pr = review.pullRequest;
      const prData = {
        id: pr.id,
        title: pr.title,
        number: pr.prNumber,
        state: pr.state,
        author: {
          id: pr.developer?.id || null,
          name: pr.developer?.name || pr.authorLogin,
          avatar:
            pr.developer?.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.authorLogin)}&background=random`,
          login: pr.authorLogin,
        },
        createdAt: pr.prCreatedAt.toISOString(),
        updatedAt: pr.prUpdatedAt.toISOString(),
        closedAt: pr.closedAt?.toISOString() || null,
        mergedAt: pr.mergedAt?.toISOString() || null,
        url: pr.htmlUrl,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        reviewState: review.state,
        reviewedAt: review.submittedAt.toISOString(),
        status: pr.mergedAt
          ? 'merged'
          : pr.state === 'closed'
            ? 'closed'
            : 'open',
      };

      switch (review.state) {
        case 'APPROVED':
          categorized.approved.push(prData);
          break;
        case 'CHANGES_REQUESTED':
          categorized.changesRequested.push(prData);
          break;
        case 'COMMENTED':
          categorized.commented.push(prData);
          break;
        default:
          categorized.pending.push(prData);
      }
    });

    return categorized;
  }

  async getDeveloperPRStatus(userId: string) {
    const repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repos.length === 0) {
      return [];
    }

    const repoIds = repos.map((r) => r.id);

    const prStats = await this.githubPRRepository
      .createQueryBuilder('pr')
      .select('pr.developer_id', 'developerId')
      .addSelect('COUNT(*)', 'totalPRs')
      .addSelect(
        "SUM(CASE WHEN pr.state = 'open' THEN 1 ELSE 0 END)",
        'openPRs',
      )
      .addSelect(
        'SUM(CASE WHEN pr.merged_at IS NOT NULL THEN 1 ELSE 0 END)',
        'mergedPRs',
      )
      .addSelect(
        "SUM(CASE WHEN pr.state = 'closed' AND pr.merged_at IS NULL THEN 1 ELSE 0 END)",
        'closedPRs',
      )
      .leftJoin('pr.developer', 'developer')
      .addSelect('developer.name', 'developerName')
      .addSelect('developer.github_username', 'githubUsername')
      .addSelect('developer.avatar_url', 'avatarUrl')
      .leftJoin('developer.squad', 'squad')
      .addSelect('squad.id', 'squadId')
      .addSelect('squad.name', 'squadName')
      .where('pr.repository_id IN (:...repoIds)', { repoIds })
      .andWhere('pr.developer_id IS NOT NULL')
      .groupBy('pr.developer_id')
      .addGroupBy('developer.name')
      .addGroupBy('developer.github_username')
      .addGroupBy('developer.avatar_url')
      .addGroupBy('squad.id')
      .addGroupBy('squad.name')
      .getRawMany();

    return prStats.map((stat: any) => ({
      developer: {
        id: stat.developerId,
        name: stat.developerName,
        githubUsername: stat.githubUsername,
        avatar:
          stat.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(stat.developerName || stat.githubUsername)}&background=random`,
        squad: stat.squadName
          ? {
              id: stat.squadId,
              name: stat.squadName,
            }
          : null,
      },
      prStatus: {
        total: parseInt(stat.totalPRs),
        open: parseInt(stat.openPRs),
        merged: parseInt(stat.mergedPRs),
        closed: parseInt(stat.closedPRs),
      },
    }));
  }

  async getRecentActivity(userId: string, repositoryId?: string, limit = 20) {
    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return [];
    }

    const repoIds = repos.map((r) => r.id);

    const recentCommits = await this.githubCommitRepository.find({
      where: {
        repositoryId: In(repoIds),
      },
      relations: ['developer'],
      order: {
        committedDate: 'DESC',
      },
      take: limit,
    });

    const recentPRs = await this.githubPRRepository.find({
      where: {
        repositoryId: In(repoIds),
      },
      relations: ['developer'],
      order: {
        prUpdatedAt: 'DESC',
      },
      take: limit,
    });

    const recentReviews = await this.githubPRReviewRepository.find({
      where: {
        pullRequest: {
          repositoryId: In(repoIds),
        },
      },
      relations: ['developer', 'pullRequest'],
      order: {
        submittedAt: 'DESC',
      },
      take: limit,
    });

    const activities = [
      ...recentCommits.map((commit) => ({
        id: `commit-${commit.id}`,
        type: 'commit' as const,
        developer: commit.developer
          ? {
              id: commit.developer.id,
              name: commit.developer.name,
              githubUsername: commit.developer.githubUsername,
              avatarUrl: commit.developer.avatarUrl,
            }
          : {
              id: null,
              name: commit.authorName,
              githubUsername: null,
              avatarUrl: null,
            },
        message: commit.message.split('\n')[0],
        timestamp: commit.committedDate,
        url: commit.htmlUrl,
      })),
      ...recentPRs.map((pr) => ({
        id: `pr-${pr.id}`,
        type: 'pull_request' as const,
        developer: pr.developer
          ? {
              id: pr.developer.id,
              name: pr.developer.name,
              githubUsername: pr.developer.githubUsername,
              avatarUrl: pr.developer.avatarUrl,
            }
          : {
              id: null,
              name: pr.authorLogin,
              githubUsername: pr.authorLogin,
              avatarUrl: null,
            },
        message: pr.title,
        state: pr.state,
        timestamp: pr.prUpdatedAt,
        url: pr.htmlUrl,
      })),
      ...recentReviews.map((review) => ({
        id: `review-${review.id}`,
        type: 'review' as const,
        developer: review.developer
          ? {
              id: review.developer.id,
              name: review.developer.name,
              githubUsername: review.developer.githubUsername,
              avatarUrl: review.developer.avatarUrl,
            }
          : {
              id: null,
              name: review.reviewerLogin,
              githubUsername: review.reviewerLogin,
              avatarUrl: null,
            },
        message: `Reviewed PR: ${review.pullRequest?.title || 'Unknown'}`,
        reviewState: review.state,
        timestamp: review.submittedAt,
        url: review.htmlUrl,
      })),
    ];

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return activities.slice(0, limit);
  }

  async getRecentPullRequests(
    userId: string,
    repositoryId?: string,
    limit = 10,
  ) {
    let repos = await this.monitoredRepoRepository.find({
      where: {
        configuration: { userId, isActive: true },
        isActive: true,
      },
    });

    if (repositoryId) {
      repos = repos.filter((r) => r.id === repositoryId);
    }

    if (repos.length === 0) {
      return [];
    }

    const repoIds = repos.map((r) => r.id);

    const prs = await this.githubPRRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.developer', 'developer')
      .where('pr.repository_id IN (:...repoIds)', { repoIds })
      .orderBy('pr.prUpdatedAt', 'DESC')
      .take(limit)
      .getMany();

    const prIds = prs.map((pr) => pr.id);
    const reviews =
      prIds.length > 0
        ? await this.githubPRReviewRepository
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.developer', 'developer')
            .where('review.pull_request_id IN (:...prIds)', { prIds })
            .orderBy('review.submittedAt', 'DESC')
            .getMany()
        : [];

    return prs.map((pr) => {
      const prReviews = reviews.filter((r) => r.pullRequestId === pr.id);
      const uniqueReviewers = new Map();

      prReviews.forEach((review) => {
        if (!uniqueReviewers.has(review.reviewerLogin)) {
          uniqueReviewers.set(review.reviewerLogin, {
            id: review.developer?.id || null,
            name: review.developer?.name || review.reviewerLogin,
            avatar:
              review.developer?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerLogin)}&background=random`,
            login: review.reviewerLogin,
            state: review.state,
            submittedAt: review.submittedAt.toISOString(),
          });
        }
      });

      return {
        id: pr.id,
        title: pr.title,
        number: pr.prNumber,
        state: pr.state,
        author: {
          id: pr.developer?.id || null,
          name: pr.developer?.name || pr.authorLogin,
          avatar:
            pr.developer?.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.authorLogin)}&background=random`,
          login: pr.authorLogin,
        },
        createdAt: pr.prCreatedAt.toISOString(),
        updatedAt: pr.prUpdatedAt.toISOString(),
        closedAt: pr.closedAt?.toISOString() || null,
        mergedAt: pr.mergedAt?.toISOString() || null,
        url: pr.htmlUrl,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        commentsCount: pr.commentsCount,
        reviewers: Array.from(uniqueReviewers.values()),
        reviewsCount: prReviews.length,
        status: pr.mergedAt
          ? 'merged'
          : pr.state === 'closed'
            ? 'closed'
            : 'open',
      };
    });
  }

  private getEmptyStats() {
    return {
      commits: {
        total: 0,
        thisWeek: 0,
        lastWeek: 0,
        percentageChange: 0,
      },
      pullRequests: {
        total: 0,
        open: 0,
        closed: 0,
        merged: 0,
        awaitingReview: 0,
      },
      reviews: {
        total: 0,
        approved: 0,
        changesRequested: 0,
        pending: 0,
      },
      period: {
        days: 30,
        since: new Date().toISOString(),
      },
    };
  }

  private getEmptyWeeklyActivity() {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const weeklyData: Array<{ day: string; commits: number; date: string }> =
      [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weeklyData.push({
        day: weekDays[date.getDay()],
        commits: 0,
        date: date.toISOString().split('T')[0],
      });
    }

    return {
      data: weeklyData,
      total: 0,
      average: 0,
    };
  }

  private getEmptyDeveloperStats() {
    return {
      commits: 0,
      pullRequests: 0,
      reviews: 0,
      mergedPRs: 0,
      period: {
        days: 30,
        since: new Date().toISOString(),
      },
    };
  }
}
