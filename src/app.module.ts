import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SquadsModule } from './squads/squads.module';
import { DevelopersModule } from './developers/developers.module';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { CommitsModule } from './commits/commits.module';
import { CodeReviewsModule } from './code-reviews/code-reviews.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportsModule } from './reports/reports.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AiRecommendationsModule } from './ai-recommendations/ai-recommendations.module';
import { GithubWebhookModule } from './github-webhook/github-webhook.module';
import { GithubModule } from './github/github.module';
import { AuthModule } from './auth/auth.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';

import { User } from './users/entities/user.entity';
import { Squad } from './squads/entities/squad.entity';
import { Developer } from './developers/entities/developer.entity';
import { PullRequest } from './pull-requests/entities/pull-request.entity';
import { Commit } from './commits/entities/commit.entity';
import { CodeReview } from './code-reviews/entities/code-review.entity';
import { Metric } from './metrics/entities/metric.entity';
import { Report } from './reports/entities/report.entity';
import { Permission } from './permissions/entities/permission.entity';
import { AIRecommendation } from './ai-recommendations/entities/ai-recommendation.entity';
import { GithubWebhook } from './github-webhook/entities/github-webhook.entity';
import { MonitoredRepository } from './github/entities/monitored-repository.entity';
import { GithubPullRequest } from './github/entities/github-pull-request.entity';
import { GithubPRReview } from './github/entities/github-pr-review.entity';
import { GithubConfiguration } from './github/entities/github-configuration.entity';
import { GithubCommit } from './github/entities/github-commit.entity';
import { PrAnalysis } from './ai-analysis/entities/pr-analysis.entity';
import { DeveloperInsightSnapshot } from './ai-analysis/entities/developer-insight-snapshot.entity';

const entities = [
  User,
  Squad,
  Developer,
  PullRequest,
  Commit,
  CodeReview,
  Metric,
  Report,
  Permission,
  AIRecommendation,
  GithubWebhook,
  MonitoredRepository,
  GithubPullRequest,
  GithubPRReview,
  GithubConfiguration,
  GithubCommit,
  PrAnalysis,
  DeveloperInsightSnapshot,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: entities,
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
    }),

    UsersModule,

    SquadsModule,

    DevelopersModule,

    PullRequestsModule,

    CommitsModule,

    CodeReviewsModule,

    MetricsModule,

    ReportsModule,

    PermissionsModule,

    AiRecommendationsModule,

    GithubWebhookModule,

    GithubModule,

    AuthModule,

    AiAnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
