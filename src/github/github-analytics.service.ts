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

      const commits = await this.githubCommitRepository.count({
        where: {
          repositoryId: In(repoIds),
          committedDate: MoreThanOrEqual(date),
        },
      });

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
      .innerJoin(GithubCommit, 'commit', 'commit.developer_id = dev.id')
      .where('commit.repository_id IN (:...repoIds)', { repoIds })
      .groupBy('dev.id')
      .getMany();

    const developersWithStats = await Promise.all(
      developers.map(async (dev) => {
        const stats = await this.getDeveloperStats(userId, dev.id, days);
        return {
          id: dev.id,
          name: dev.name,
          githubUsername: dev.githubUsername,
          email: dev.email,
          avatarUrl: dev.avatarUrl,
          stats,
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
