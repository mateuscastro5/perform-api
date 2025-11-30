import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Import all entities
import { User } from '../users/entities/user.entity';
import { Squad } from '../squads/entities/squad.entity';
import { Developer } from '../developers/entities/developer.entity';
import { PullRequest } from '../pull-requests/entities/pull-request.entity';
import { Commit } from '../commits/entities/commit.entity';
import { CodeReview } from '../code-reviews/entities/code-review.entity';
import { Metric } from '../metrics/entities/metric.entity';
import { Report } from '../reports/entities/report.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { AiRecommendation } from '../ai-recommendations/entities/ai-recommendation.entity';
import { GithubWebhook } from '../github-webhook/entities/github-webhook.entity';
import { MonitoredRepository } from '../github/entities/monitored-repository.entity';
import { GithubPullRequest } from '../github/entities/github-pull-request.entity';
import { GithubPrReview } from '../github/entities/github-pr-review.entity';
import { GithubConfiguration } from '../github/entities/github-configuration.entity';
import { GithubCommit } from '../github/entities/github-commit.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Squad,
    Developer,
    PullRequest,
    Commit,
    CodeReview,
    Metric,
    Report,
    Permission,
    AiRecommendation,
    GithubWebhook,
    MonitoredRepository,
    GithubPullRequest,
    GithubPrReview,
    GithubConfiguration,
    GithubCommit,
  ],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
  logging: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
