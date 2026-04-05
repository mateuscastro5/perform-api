import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PrAnalysis } from './entities/pr-analysis.entity';
import { GithubPullRequest } from '../github/entities/github-pull-request.entity';
import { GithubConfiguration } from '../github/entities/github-configuration.entity';
import { GithubApiService } from '../github/github-api.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private readonly aiServiceUrl: string;
  private readonly aiServiceApiKey: string;

  constructor(
    @InjectRepository(PrAnalysis)
    private readonly prAnalysisRepo: Repository<PrAnalysis>,
    @InjectRepository(GithubPullRequest)
    private readonly githubPrRepo: Repository<GithubPullRequest>,
    @InjectRepository(GithubConfiguration)
    private readonly githubConfigRepo: Repository<GithubConfiguration>,
    private readonly githubApiService: GithubApiService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    this.aiServiceApiKey =
      this.configService.get<string>('AI_SERVICE_API_KEY') || '';
  }

  async triggerAnalysis(
    githubPrId: string,
    userId: string,
  ): Promise<PrAnalysis> {
    // 1. Load the PR with its repository
    const pr = await this.githubPrRepo.findOne({
      where: { id: githubPrId },
      relations: ['repository'],
    });

    if (!pr) {
      throw new NotFoundException(`GithubPullRequest ${githubPrId} not found`);
    }

    // 2. Find a GithubConfiguration with a token for this repository
    const config = await this.githubConfigRepo
      .createQueryBuilder('config')
      .addSelect('config.githubToken')
      .innerJoin('config.repositories', 'repo', 'repo.id = :repoId', {
        repoId: pr.repositoryId,
      })
      .where('config.isActive = :active', { active: true })
      .getOne();

    if (!config) {
      throw new NotFoundException(
        `No active GitHub configuration found for repository ${pr.repositoryId}`,
      );
    }

    // 3. Fetch the diff from GitHub
    const [owner, repo] = pr.repository.repoFullName.split('/');
    this.logger.log(
      `Fetching diff for PR #${pr.prNumber} from ${pr.repository.repoFullName}`,
    );

    const diff = await this.githubApiService.getPullRequestDiff(
      config.githubToken,
      owner,
      repo,
      pr.prNumber,
    );

    // 4. Send to FastAPI for analysis
    this.logger.log(
      `Sending PR #${pr.prNumber} to AI service for analysis...`,
    );

    const response = await fetch(`${this.aiServiceUrl}/api/v1/analyze-pr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.aiServiceApiKey,
      },
      body: JSON.stringify({
        pr_id: pr.id,
        title: pr.title,
        body: pr.body || '',
        diff: diff,
        author: pr.authorLogin,
        repo_full_name: pr.repository.repoFullName,
        pr_number: pr.prNumber,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changedFiles,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI service returned ${response.status}: ${error}`);
    }

    const result = await response.json();

    // 5. Save the analysis result
    const analysis = this.prAnalysisRepo.create({
      githubPullRequestId: pr.id,
      developerId: pr.developerId,
      complexityScore: result.score,
      confidence: result.confidence,
      difficultyLabel: result.difficulty_label,
      justification: result.justification,
      technicalSummary: result.technical_summary,
      technologies: JSON.stringify(result.technologies),
      changeType: result.change_type,
      status: result.requires_review ? 'doubtful' : 'confirmed',
      processingTimeMs: result.processing_time_ms,
      llmReaderModel: 'gemini-2.0-flash',
      llmScorerModel: 'gemini-2.0-pro',
      similarExamplesUsed: JSON.stringify(result.similar_examples),
    });

    const saved = await this.prAnalysisRepo.save(analysis);
    this.logger.log(
      `Analysis saved for PR #${pr.prNumber}: score=${result.score}, confidence=${result.confidence}, status=${saved.status}`,
    );

    return saved;
  }

  async getAnalysisByPrId(githubPrId: string): Promise<PrAnalysis | null> {
    return this.prAnalysisRepo.findOne({
      where: { githubPullRequestId: githubPrId },
      relations: ['githubPullRequest', 'developer'],
    });
  }

  async getAnalysesByDeveloper(
    developerId: string,
    limit = 50,
  ): Promise<PrAnalysis[]> {
    return this.prAnalysisRepo.find({
      where: { developerId },
      relations: ['githubPullRequest'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getDeveloperEvolution(
    developerId: string,
    days = 90,
  ): Promise<{
    periods: { date: string; avgComplexity: number; prCount: number; maxComplexity: number }[];
    trend: string;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const analyses = await this.prAnalysisRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.created_at, 'YYYY-MM-W')", 'period')
      .addSelect('AVG(a.complexity_score)', 'avg_complexity')
      .addSelect('COUNT(*)', 'pr_count')
      .addSelect('MAX(a.complexity_score)', 'max_complexity')
      .where('a.developer_id = :developerId', { developerId })
      .andWhere('a.created_at >= :since', { since })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const periods = analyses.map((r) => ({
      date: r.period,
      avgComplexity: parseFloat(r.avg_complexity) || 0,
      prCount: parseInt(r.pr_count) || 0,
      maxComplexity: parseFloat(r.max_complexity) || 0,
    }));

    // Simple trend detection
    let trend = 'stable';
    if (periods.length >= 2) {
      const first = periods[0].avgComplexity;
      const last = periods[periods.length - 1].avgComplexity;
      if (last > first * 1.15) trend = 'improving';
      else if (last < first * 0.85) trend = 'declining';
    }

    return { periods, trend };
  }

  async getSquadReport(
    squadId: string,
    days = 30,
  ): Promise<{
    developers: {
      id: string;
      name: string;
      avgComplexity: number;
      prCount: number;
      trend: string;
    }[];
    totalComplexityAbsorbed: number;
    avgTeamComplexity: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await this.prAnalysisRepo
      .createQueryBuilder('a')
      .innerJoin('a.developer', 'd')
      .select('d.id', 'developer_id')
      .addSelect('d.name', 'developer_name')
      .addSelect('AVG(a.complexity_score)', 'avg_complexity')
      .addSelect('COUNT(*)', 'pr_count')
      .addSelect('SUM(a.complexity_score)', 'total_complexity')
      .where('d.squad_id = :squadId', { squadId })
      .andWhere('a.created_at >= :since', { since })
      .groupBy('d.id')
      .addGroupBy('d.name')
      .getRawMany();

    const developers = results.map((r) => ({
      id: r.developer_id,
      name: r.developer_name || 'Unknown',
      avgComplexity: parseFloat(r.avg_complexity) || 0,
      prCount: parseInt(r.pr_count) || 0,
      trend: 'stable',
    }));

    const totalComplexityAbsorbed = results.reduce(
      (sum, r) => sum + (parseFloat(r.total_complexity) || 0),
      0,
    );
    const avgTeamComplexity =
      developers.length > 0
        ? developers.reduce((sum, d) => sum + d.avgComplexity, 0) /
          developers.length
        : 0;

    return { developers, totalComplexityAbsorbed, avgTeamComplexity };
  }

  async submitFeedback(
    analysisId: string,
    userId: string,
    dto: SubmitFeedbackDto,
  ): Promise<PrAnalysis> {
    const analysis = await this.prAnalysisRepo.findOne({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis ${analysisId} not found`);
    }

    // Update the analysis record
    analysis.correctedScore = dto.correctedScore;
    analysis.correctedLabel = dto.correctedLabel;
    analysis.correctedBy = userId;
    analysis.correctedAt = new Date();
    analysis.feedbackNote = dto.feedbackNote || null;
    analysis.status = 'corrected';

    const saved = await this.prAnalysisRepo.save(analysis);

    // Send feedback to FastAPI to update Qdrant
    try {
      await fetch(`${this.aiServiceUrl}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.aiServiceApiKey,
        },
        body: JSON.stringify({
          analysis_id: analysis.id,
          pr_id: analysis.githubPullRequestId,
          original_score: analysis.complexityScore,
          corrected_score: dto.correctedScore,
          corrected_label: dto.correctedLabel,
          corrected_by: userId,
          technical_summary: analysis.technicalSummary,
          diff_snippet: '',
        }),
      });

      this.logger.log(
        `Feedback sent to AI service for analysis ${analysisId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send feedback to AI service: ${error.message}`,
      );
    }

    return saved;
  }

  async getDoubtfulAnalyses(limit = 50): Promise<PrAnalysis[]> {
    return this.prAnalysisRepo.find({
      where: { status: 'doubtful' },
      relations: ['githubPullRequest', 'developer'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
