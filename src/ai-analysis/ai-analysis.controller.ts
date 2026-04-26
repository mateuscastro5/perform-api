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
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiAnalysisService } from './ai-analysis.service';
import { TriggerBatchAnalysisDto } from './dto/trigger-analysis.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('ai-analysis')
@UseGuards(JwtAuthGuard)
export class AiAnalysisController {
  private readonly logger = new Logger(AiAnalysisController.name);

  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('trigger/:prId')
  async triggerAnalysis(@Param('prId') prId: string, @Request() req: any) {
    return this.aiAnalysisService.triggerAnalysis(prId, req.user.id);
  }

  @Post('trigger-batch')
  triggerBatchAnalysis(
    @Body() dto: TriggerBatchAnalysisDto,
    @Request() req: any,
  ) {
    if (dto.githubPullRequestIds.length > 20) {
      throw new BadRequestException('Batch limit is 20 PRs per request');
    }
    const ids = [...dto.githubPullRequestIds];
    const userId = req.user.id;

    // Fire-and-forget: kick off the batch in the background and respond
    // immediately so the client doesn't block on the long-running pipeline.
    setImmediate(() => {
      void this.runBatchInBackground(ids, userId);
    });

    return {
      status: 'queued',
      queued: ids.length,
      message: 'Analyses started in background. Poll /ai-analysis/developer/:id to track progress.',
    };
  }

  private async runBatchInBackground(ids: string[], userId: string): Promise<void> {
    this.logger.log(`Background batch started: ${ids.length} PRs for user ${userId}`);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await this.aiAnalysisService.triggerAnalysis(ids[i], userId);
        ok++;
      } catch (error) {
        fail++;
        this.logger.warn(`Background analysis failed for PR ${ids[i]}: ${error.message}`);
      }
      if (i < ids.length - 1) await this.sleep(2000);
    }
    this.logger.log(`Background batch finished: ok=${ok} fail=${fail}`);
  }

  @Post('trigger-commit/:commitId')
  async triggerCommitAnalysis(@Param('commitId') commitId: string, @Request() req: any) {
    return this.aiAnalysisService.triggerCommitAnalysis(commitId, req.user.id);
  }

  @Post('trigger-commits-batch')
  triggerCommitsBatch(
    @Body() dto: { githubCommitIds: string[] },
    @Request() req: any,
  ) {
    if (!Array.isArray(dto?.githubCommitIds)) {
      throw new BadRequestException('githubCommitIds must be an array');
    }
    if (dto.githubCommitIds.length > 20) {
      throw new BadRequestException('Batch limit is 20 commits per request');
    }
    const ids = [...dto.githubCommitIds];
    const userId = req.user.id;

    setImmediate(() => {
      void this.runCommitsBatchInBackground(ids, userId);
    });

    return {
      status: 'queued',
      queued: ids.length,
      message: 'Commit analyses started in background.',
    };
  }

  private async runCommitsBatchInBackground(ids: string[], userId: string): Promise<void> {
    this.logger.log(`Background commits batch started: ${ids.length} commits`);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await this.aiAnalysisService.triggerCommitAnalysis(ids[i], userId);
        ok++;
      } catch (error) {
        fail++;
        this.logger.warn(`Background commit analysis failed for ${ids[i]}: ${error.message}`);
      }
      if (i < ids.length - 1) await this.sleep(2000);
    }
    this.logger.log(`Background commits batch finished: ok=${ok} fail=${fail}`);
  }

  @Get('developer/:developerId/unanalyzed-commits')
  async getUnanalyzedCommits(
    @Param('developerId') developerId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.aiAnalysisService.getUnanalyzedCommits(developerId, limit);
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
    @Request() _req: any,
  ) {
    return this.aiAnalysisService.clearDeveloperMemory(developerId);
  }
}
