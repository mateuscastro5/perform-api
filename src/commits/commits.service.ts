import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommitDto } from './dto/create-commit.dto';
import { UpdateCommitDto } from './dto/update-commit.dto';
import { Commit } from './entities/commit.entity';

@Injectable()
export class CommitsService {
  constructor(
    @InjectRepository(Commit)
    private commitsRepository: Repository<Commit>,
  ) {}

  create(createCommitDto: CreateCommitDto) {
    return this.commitsRepository.save(createCommitDto);
  }

  async findAll(userId?: string) {
    const queryBuilder = this.commitsRepository
      .createQueryBuilder('commit')
      .leftJoinAndSelect('commit.author', 'author')
      .orderBy('commit.committedAt', 'DESC');

    if (userId) {
      queryBuilder.where('author.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async getMetrics(userId?: string) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const queryBuilder = this.commitsRepository
      .createQueryBuilder('commit')
      .leftJoin('commit.author', 'author');

    if (userId) {
      queryBuilder.where('author.id = :userId', { userId });
    }

    const thisWeekCommits = await queryBuilder
      .clone()
      .where('commit.committedAt >= :oneWeekAgo', { oneWeekAgo })
      .getCount();

    const lastWeekCommits = await queryBuilder
      .clone()
      .where('commit.committedAt >= :twoWeeksAgo', { twoWeeksAgo })
      .andWhere('commit.committedAt < :oneWeekAgo', { oneWeekAgo })
      .getCount();

    const percentageChange =
      lastWeekCommits > 0
        ? ((thisWeekCommits - lastWeekCommits) / lastWeekCommits) * 100
        : 0;

    return {
      thisWeek: thisWeekCommits,
      lastWeek: lastWeekCommits,
      percentageChange: Math.round(percentageChange),
    };
  }

  async getWeeklyData(userId?: string) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const queryBuilder = this.commitsRepository
      .createQueryBuilder('commit')
      .leftJoin('commit.author', 'author')
      .where('commit.committedAt >= :oneWeekAgo', { oneWeekAgo });

    if (userId) {
      queryBuilder.andWhere('author.id = :userId', { userId });
    }

    const commits = await queryBuilder.getMany();

    const weeklyData = days.map((day, index) => {
      const dayCommits = commits.filter(
        (commit) => new Date(commit.committedAt).getDay() === index,
      );
      return {
        day,
        commits: dayCommits.length,
        linesAdded: dayCommits.reduce((sum, c) => sum + c.linesAdded, 0),
        linesDeleted: dayCommits.reduce((sum, c) => sum + c.linesDeleted, 0),
      };
    });

    return weeklyData;
  }

  findOne(id: string) {
    return this.commitsRepository.findOne({
      where: { id },
      relations: ['author', 'pullRequest'],
    });
  }

  update(id: string, updateCommitDto: UpdateCommitDto) {
    return this.commitsRepository.update(id, updateCommitDto);
  }

  remove(id: string) {
    return this.commitsRepository.softDelete(id);
  }
}
