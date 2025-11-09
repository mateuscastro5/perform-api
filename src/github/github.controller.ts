import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GithubService } from './github.service';
import { GithubDataCollectorService } from './github-data-collector.service';
import { GithubAnalyticsService } from './github-analytics.service';
import { ConfigureGithubDto } from './dto/configure-github.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { ConnectGithubDto } from './dto/connect-github.dto';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly githubDataCollectorService: GithubDataCollectorService,
    private readonly githubAnalyticsService: GithubAnalyticsService,
  ) {}

  @Get('status')
  async getStatus(@Request() req: any) {
    return this.githubService.getStatus(req.user.id);
  }

  @Get('oauth-url')
  getOAuthUrl() {
    return this.githubService.getOAuthUrl();
  }

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async connectWithToken(@Request() req: any, @Body() dto: ConnectGithubDto) {
    return this.githubService.connectWithToken(dto.token, req.user.id);
  }

  @Post('oauth-callback')
  @HttpCode(HttpStatus.OK)
  async handleOAuthCallback(@Request() req: any, @Body() dto: OAuthCallbackDto) {
    return this.githubService.handleOAuthCallback(dto.code, req.user.id);
  }

  @Get('repositories')
  async listRepositories(@Request() req: any) {
    return this.githubService.listRepositories(req.user.id);
  }

  @Post('configure')
  @HttpCode(HttpStatus.OK)
  async configure(@Request() req: any, @Body() dto: ConfigureGithubDto) {
    return this.githubService.saveConfiguration(req.user.id, dto);
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@Request() req: any) {
    return this.githubService.disconnect(req.user.id);
  }

  @Post('collect-data')
  @HttpCode(HttpStatus.OK)
  async collectData(@Request() req: any) {
    await this.githubDataCollectorService.forceCollectForUser(req.user.id);
    return {
      success: true,
      message: 'Data collection started successfully',
    };
  }

  @Get('analytics/dashboard')
  async getDashboardStats(
    @Request() req: any,
    @Query('days') days?: string,
    @Query('repositoryId') repositoryId?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.githubAnalyticsService.getDashboardStats(
      req.user.id,
      daysNum,
      repositoryId,
    );
  }

  @Get('analytics/weekly-activity')
  async getWeeklyActivity(
    @Request() req: any,
    @Query('repositoryId') repositoryId?: string,
  ) {
    return this.githubAnalyticsService.getWeeklyActivity(
      req.user.id,
      repositoryId,
    );
  }

  @Get('analytics/collaboration')
  async getCollaborationMetrics(
    @Request() req: any,
    @Query('repositoryId') repositoryId?: string,
  ) {
    return this.githubAnalyticsService.getCollaborationMetrics(
      req.user.id,
      repositoryId,
    );
  }

  @Get('analytics/developers')
  async getAllDevelopers(
    @Request() req: any,
    @Query('days') days?: string,
    @Query('repositoryId') repositoryId?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.githubAnalyticsService.getAllDevelopersWithStats(
      req.user.id,
      daysNum,
      repositoryId,
    );
  }

  @Get('analytics/repositories')
  async getMonitoredRepositories(@Request() req: any) {
    return this.githubAnalyticsService.getMonitoredRepositories(req.user.id);
  }

  @Get('analytics/developers/:id')
  async getDeveloperStats(
    @Request() req: any,
    @Param('id') developerId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.githubAnalyticsService.getDeveloperStats(
      req.user.id,
      developerId,
      daysNum,
    );
  }
}
