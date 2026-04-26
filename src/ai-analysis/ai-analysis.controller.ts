import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { AiAnalysisService } from './ai-analysis.service';
import { TriggerBatchAnalysisDto } from './dto/trigger-analysis.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('ai-analysis')
@UseGuards(JwtAuthGuard)
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('trigger/:prId')
  async triggerAnalysis(@Param('prId') prId: string, @Request() req: any) {
    return this.aiAnalysisService.triggerAnalysis(prId, req.user.id);
  }

  @Post('trigger-batch')
  async triggerBatchAnalysis(
    @Body() dto: TriggerBatchAnalysisDto,
    @Request() req: any,
  ) {
    if (dto.githubPullRequestIds.length > 20) {
      throw new BadRequestException('Batch limit is 20 PRs per request');
    }
    const results: { prId: string; status: string; analysis?: any; error?: string }[] = [];
    const ids = dto.githubPullRequestIds;
    for (let i = 0; i < ids.length; i++) {
      const prId = ids[i];
      try {
        const analysis = await this.aiAnalysisService.triggerAnalysis(
          prId,
          req.user.id,
        );
        results.push({ prId, status: 'success', analysis });
      } catch (error) {
        results.push({ prId, status: 'error', error: error.message });
      }
      if (i < ids.length - 1) {
        await this.sleep(2000);
      }
    }
    return results;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  @Get('pr/:prId')
  async getAnalysisByPr(@Param('prId') prId: string) {
    return this.aiAnalysisService.getAnalysisByPrId(prId);
  }

  @Get('developer/:developerId')
  async getAnalysesByDeveloper(
    @Param('developerId') developerId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.aiAnalysisService.getAnalysesByDeveloper(developerId, limit);
  }

  @Get('developer/:developerId/evolution')
  async getDeveloperEvolution(
    @Param('developerId') developerId: string,
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
  ) {
    return this.aiAnalysisService.getDeveloperEvolution(developerId, days);
  }

  @Get('squad/:squadId/report')
  async getSquadReport(
    @Param('squadId') squadId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.aiAnalysisService.getSquadReport(squadId, days);
  }

  @Post(':analysisId/feedback')
  async submitFeedback(
    @Param('analysisId') analysisId: string,
    @Body() dto: SubmitFeedbackDto,
    @Request() req: any,
  ) {
    return this.aiAnalysisService.submitFeedback(analysisId, req.user.id, dto);
  }

  @Get('doubtful')
  async getDoubtfulAnalyses(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.aiAnalysisService.getDoubtfulAnalyses(limit);
  }

  @Get('developer/:developerId/insights')
  async getDeveloperInsights(
    @Param('developerId') developerId: string,
    @Query('refresh', new DefaultValuePipe(false), ParseBoolPipe)
    refresh: boolean,
  ) {
    return this.aiAnalysisService.getDeveloperInsights(developerId, refresh);
  }

  @Delete('developer/:developerId/memory')
  async clearDeveloperMemory(
    @Param('developerId') developerId: string,
    @Request() req: any,
  ) {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can clear developer memory.',
      );
    }
    return this.aiAnalysisService.clearDeveloperMemory(developerId);
  }
}
