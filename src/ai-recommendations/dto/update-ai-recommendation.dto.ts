import { PartialType } from '@nestjs/mapped-types';
import { CreateAiRecommendationDto } from './create-ai-recommendation.dto';

export class UpdateAiRecommendationDto extends PartialType(
  CreateAiRecommendationDto,
) {}
