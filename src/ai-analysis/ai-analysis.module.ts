import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { PrAnalysis } from './entities/pr-analysis.entity';
import { GithubPullRequest } from '../github/entities/github-pull-request.entity';
import { GithubConfiguration } from '../github/entities/github-configuration.entity';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrAnalysis,
      GithubPullRequest,
      GithubConfiguration,
    ]),
    ConfigModule,
    GithubModule,
  ],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}
