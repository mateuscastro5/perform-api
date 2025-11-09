import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AiRecommendationsService } from './ai-recommendations.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { UpdateAiRecommendationDto } from './dto/update-ai-recommendation.dto';

@Controller('ai-recommendations')
export class AiRecommendationsController {
  constructor(
    private readonly aiRecommendationsService: AiRecommendationsService,
  ) {}

  @Post()
  create(@Body() createAiRecommendationDto: CreateAiRecommendationDto) {
    return this.aiRecommendationsService.create(createAiRecommendationDto);
  }

  @Get()
  findAll() {
    return this.aiRecommendationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiRecommendationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAiRecommendationDto: UpdateAiRecommendationDto,
  ) {
    return this.aiRecommendationsService.update(+id, updateAiRecommendationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiRecommendationsService.remove(+id);
  }
}
