import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubApiService } from './github-api.service';
import { GithubDataCollectorService } from './github-data-collector.service';
import { GithubAnalyticsService } from './github-analytics.service';
import { GithubConfiguration } from './entities/github-configuration.entity';
import { MonitoredRepository } from './entities/monitored-repository.entity';
import { GithubCommit } from './entities/github-commit.entity';
import { GithubPullRequest } from './entities/github-pull-request.entity';
import { GithubPRReview } from './entities/github-pr-review.entity';
import { Developer } from '../developers/entities/developer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GithubConfiguration,
      MonitoredRepository,
      GithubCommit,
      GithubPullRequest,
      GithubPRReview,
      Developer,
    ]),
    ConfigModule,
  ],
  controllers: [GithubController],
  providers: [
    GithubService,
    GithubApiService,
    GithubDataCollectorService,
    GithubAnalyticsService,
  ],
  exports: [
    GithubService,
    GithubApiService,
    GithubDataCollectorService,
    GithubAnalyticsService,
  ],
})
export class GithubModule {}
