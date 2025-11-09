import { Injectable } from '@nestjs/common';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { UpdateAiRecommendationDto } from './dto/update-ai-recommendation.dto';

@Injectable()
export class AiRecommendationsService {
  create(createAiRecommendationDto: CreateAiRecommendationDto) {
    return 'This action adds a new aiRecommendation';
  }

  findAll() {
    return `This action returns all aiRecommendations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiRecommendation`;
  }

  update(id: number, updateAiRecommendationDto: UpdateAiRecommendationDto) {
    return `This action updates a #${id} aiRecommendation`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiRecommendation`;
  }
}
