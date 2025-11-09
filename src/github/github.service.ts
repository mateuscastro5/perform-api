import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GithubConfiguration } from './entities/github-configuration.entity';
import { MonitoredRepository } from './entities/monitored-repository.entity';
import { ConfigureGithubDto } from './dto/configure-github.dto';
import { GithubApiService } from './github-api.service';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    @InjectRepository(GithubConfiguration)
    private githubConfigRepository: Repository<GithubConfiguration>,
    @InjectRepository(MonitoredRepository)
    private monitoredRepoRepository: Repository<MonitoredRepository>,
    private configService: ConfigService,
    private githubApiService: GithubApiService,
  ) {}

  async getStatus(userId: string) {
    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      relations: ['repositories'],
    });

    if (!config) {
      return { connected: false };
    }

    return {
      connected: true,
      githubUsername: config.githubUsername,
      dataRange: config.dataRange,
      repositories: config.repositories.map((repo) => ({
        id: repo.repoId,
        name: repo.repoName,
        fullName: repo.repoFullName,
        description: repo.description,
        private: repo.isPrivate,
        isActive: repo.isActive,
      })),
      selectedRepos: config.repositories
        .filter((repo) => repo.isActive)
        .map((repo) => parseInt(repo.repoId)),
    };
  }

  getOAuthUrl() {
    // Para aplicações desktop, vamos usar GitHub Device Flow ou Personal Access Token
    return {
      method: 'device_flow',
      instructions: {
        step1: 'Acesse https://github.com/settings/tokens/new',
        step2: 'Crie um Personal Access Token com as seguintes permissões:',
        scopes: ['repo', 'read:user', 'admin:repo_hook'],
        step3: 'Copie o token gerado e cole na aplicação',
        note: 'Recomendamos usar: "Perform - Desktop App"',
      },
      alternativeMethod: {
        name: 'GitHub Device Flow',
        description:
          'Iniciará um fluxo de autenticação via código no navegador',
      },
    };
  }

  async connectWithToken(token: string, userId: string) {
    try {
      const githubUser =
        await this.githubApiService.getAuthenticatedUser(token);

      let config = await this.githubConfigRepository.findOne({
        where: { userId },
      });

      if (config) {
        config.githubToken = token;
        config.githubUsername = githubUser.login;
        config.githubUserId = githubUser.id.toString();
        config.isActive = true;
      } else {
        config = this.githubConfigRepository.create({
          userId,
          githubToken: token,
          githubUsername: githubUser.login,
          githubUserId: githubUser.id.toString(),
          dataRange: 1,
          isActive: true,
        });
      }

      await this.githubConfigRepository.save(config);

      return {
        success: true,
        message: 'GitHub connected successfully',
        username: githubUser.login,
      };
    } catch (error) {
      this.logger.error('Error connecting to GitHub:', error);
      throw error;
    }
  }

  async handleOAuthCallback(code: string, userId: string) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new HttpException(
        'OAuth tradicional não configurado. Use Personal Access Token',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new HttpException(
          'Failed to get GitHub token',
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokenData: { access_token?: string } = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new HttpException(
          'Failed to get GitHub token',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.connectWithToken(accessToken, userId);
    } catch (error) {
      this.logger.error('Error in OAuth callback:', error);
      throw new HttpException(
        'Error connecting to GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listRepositories(userId: string) {
    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      select: ['id', 'githubToken', 'userId', 'githubUsername'],
    });

    if (!config || !config.githubToken) {
      throw new HttpException(
        'GitHub não conectado. Conecte sua conta primeiro.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const repos = await this.githubApiService.listUserRepositories(
        config.githubToken,
        {
          perPage: 100,
          sort: 'updated',
          direction: 'desc',
          affiliation: 'owner,collaborator,organization_member',
        },
      );

      return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        updatedAt: repo.updated_at,
      }));
    } catch (error) {
      this.logger.error('Error listing repositories:', error);
      throw error;
    }
  }

  async saveConfiguration(userId: string, dto: ConfigureGithubDto) {
    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      select: ['id', 'githubToken', 'userId'],
      relations: ['repositories'],
    });

    if (!config || !config.githubToken) {
      throw new HttpException('GitHub não conectado', HttpStatus.BAD_REQUEST);
    }

    try {
      config.dataRange = dto.dataRange;
      await this.githubConfigRepository.save(config);

      const allRepos = await this.listRepositories(userId);
      const selectedRepoIds = dto.repositories.map(String);

      const reposToRemove = config.repositories.filter(
        (repo) => !selectedRepoIds.includes(repo.repoId),
      );

      for (const repo of reposToRemove) {
        if (repo.webhookId) {
          await this.deleteWebhook(
            config.githubToken,
            repo.repoFullName,
            repo.webhookId,
          );
        }
        await this.monitoredRepoRepository.remove(repo);
      }

      for (const repoId of selectedRepoIds) {
        const repoData = allRepos.find((r) => r.id.toString() === repoId);
        if (!repoData) continue;

        let monitoredRepo = config.repositories.find(
          (r) => r.repoId === repoId,
        );

        if (monitoredRepo) {
          monitoredRepo.isActive = true;
        } else {
          const webhookId = await this.createWebhook(
            config.githubToken,
            repoData.fullName,
          );

          monitoredRepo = this.monitoredRepoRepository.create({
            configuration: config,
            repoId: repoData.id.toString(),
            repoName: repoData.name,
            repoFullName: repoData.fullName,
            description: repoData.description || undefined,
            isPrivate: repoData.private,
            webhookId: webhookId?.toString(),
            isActive: true,
          });
        }

        await this.monitoredRepoRepository.save(monitoredRepo);
      }

      return {
        success: true,
        message: 'Configuration saved successfully',
      };
    } catch (error) {
      this.logger.error('Error saving configuration:', error);
      throw new HttpException(
        'Error saving configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createWebhook(token: string, repoFullName: string) {
    const webhookUrl = this.configService.get<string>('GITHUB_WEBHOOK_URL');
    const webhookSecret = this.configService.get<string>(
      'GITHUB_WEBHOOK_SECRET',
    );

    if (!webhookUrl) {
      this.logger.warn(
        'GITHUB_WEBHOOK_URL not configured. Webhook will not be created.',
      );
      return null;
    }

    try {
      const [owner, repo] = repoFullName.split('/');

      const webhook = await this.githubApiService.createWebhook(
        token,
        owner,
        repo,
        {
          url: webhookUrl,
          secret: webhookSecret,
          events: [
            'push',
            'pull_request',
            'pull_request_review',
            'pull_request_review_comment',
            'issues',
            'issue_comment',
          ],
        },
      );

      return webhook.id;
    } catch (error) {
      this.logger.error(`Erro ao criar webhook para ${repoFullName}:`, error);
      return null;
    }
  }

  private async deleteWebhook(
    token: string,
    repoFullName: string,
    webhookId: string,
  ) {
    try {
      const [owner, repo] = repoFullName.split('/');

      await this.githubApiService.deleteWebhook(
        token,
        owner,
        repo,
        parseInt(webhookId),
      );
    } catch (error) {
      this.logger.error(
        `Error deleting webhook ${webhookId} from ${repoFullName}:`,
        error,
      );
    }
  }

  async disconnect(userId: string) {
    const config = await this.githubConfigRepository.findOne({
      where: { userId, isActive: true },
      select: ['id', 'githubToken', 'userId'],
      relations: ['repositories'],
    });

    if (!config) {
      throw new HttpException('GitHub not connected', HttpStatus.BAD_REQUEST);
    }

    try {
      for (const repo of config.repositories) {
        if (repo.webhookId && config.githubToken) {
          await this.deleteWebhook(
            config.githubToken,
            repo.repoFullName,
            repo.webhookId,
          );
        }
      }

      await this.githubConfigRepository.remove(config);

      return {
        success: true,
        message: 'GitHub disconnected successfully',
      };
    } catch (error) {
      this.logger.error('Error disconnecting GitHub:', error);
      throw new HttpException(
        'Error disconnecting GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
