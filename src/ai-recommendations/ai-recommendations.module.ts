import { Module } from '@nestjs/common';
import { AiRecommendationsService } from './ai-recommendations.service';
import { AiRecommendationsController } from './ai-recommendations.controller';

@Module({
  controllers: [AiRecommendationsController],
  providers: [AiRecommendationsService],
})
export class AiRecommendationsModule {}
