import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    const results: { prId: string; status: string; analysis?: any; error?: string }[] = [];
    for (const prId of dto.githubPullRequestIds) {
      try {
        const analysis = await this.aiAnalysisService.triggerAnalysis(
          prId,
          req.user.id,
        );
        results.push({ prId, status: 'success', analysis });
      } catch (error) {
        results.push({ prId, status: 'error', error: error.message });
      }
    }
    return results;
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
}
