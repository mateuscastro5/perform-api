import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './database/data-source';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot(dataSourceOptions),

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
