import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';
import { PullRequest, PullRequestStatus } from './entities/pull-request.entity';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectRepository(PullRequest)
    private pullRequestsRepository: Repository<PullRequest>,
  ) {}

  create(createPullRequestDto: CreatePullRequestDto) {
    return this.pullRequestsRepository.save(createPullRequestDto);
  }

  async findAll(
    status?: string,
    userId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.pullRequestsRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.author', 'author')
      .leftJoinAndSelect('pr.reviews', 'reviews')
      .leftJoinAndSelect('reviews.reviewer', 'reviewer')
      .orderBy('pr.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('pr.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('author.id = :userId', { userId });
    }

    const [prs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      prs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMetrics(userId?: string) {
    const baseQuery = this.pullRequestsRepository
      .createQueryBuilder('pr')
      .leftJoin('pr.author', 'author');

    const openQuery = baseQuery.clone().where('pr.status = :status', {
      status: PullRequestStatus.OPEN,
    });
    if (userId) {
      openQuery.andWhere('author.id = :userId', { userId });
    }
    const openPRs = await openQuery.getCount();

    const awaitingReviewQuery = baseQuery
      .clone()
      .leftJoin('pr.reviews', 'review')
      .where('pr.status = :status', { status: PullRequestStatus.OPEN });

    if (userId) {
      awaitingReviewQuery.andWhere('author.id = :userId', { userId });
    }

    const awaitingReview = await awaitingReviewQuery.getCount();

    const mergedQuery = baseQuery
      .clone()
      .where('pr.status = :status', { status: PullRequestStatus.MERGED })
      .andWhere('pr.mergedAt >= :oneWeekAgo', {
        oneWeekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });

    if (userId) {
      mergedQuery.andWhere('author.id = :userId', { userId });
    }

    const mergedThisWeek = await mergedQuery.getCount();

    return {
      open: openPRs,
      awaitingReview,
      mergedThisWeek,
    };
  }

  findOne(id: string) {
    return this.pullRequestsRepository.findOne({
      where: { id },
      relations: ['author', 'reviews', 'reviews.reviewer', 'commits'],
    });
  }

  update(id: string, updatePullRequestDto: UpdatePullRequestDto) {
    return this.pullRequestsRepository.update(id, updatePullRequestDto);
  }

  remove(id: string) {
    return this.pullRequestsRepository.softDelete(id);
  }
}
