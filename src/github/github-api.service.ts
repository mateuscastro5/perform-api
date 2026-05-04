import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly apiVersion = '2022-11-28';

  private async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': this.apiVersion,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');

      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
        this.logger.warn(
          `Critical rate limit: ${rateLimitRemaining} requests remaining. Reset at ${new Date(parseInt(rateLimitReset!) * 1000).toISOString()}`,
        );
      }

      if (!response.ok) {
        await this.handleError(response);
      }

      if (response.status === 204 || options.method === 'DELETE') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (!(error instanceof HttpException)) {
        this.logger.error(`Request error for ${url}:`, error);
      }
      throw error;
    }
  }

  private async handleError(response: Response) {
    let errorMessage = 'Erro ao comunicar com GitHub';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;

      switch (response.status) {
        case 401:
          errorMessage = 'Token inválido ou expirado';
          statusCode = HttpStatus.UNAUTHORIZED;
          break;
        case 403:
          if (response.headers.get('x-ratelimit-remaining') === '0') {
            errorMessage = 'Rate limit excedido. Tente novamente mais tarde.';
          } else {
            errorMessage =
              'Permissões insuficientes. Verifique os escopos do token.';
          }
          statusCode = HttpStatus.FORBIDDEN;
          break;
        case 404:
          errorMessage = 'Recurso não encontrado no GitHub';
          statusCode = HttpStatus.NOT_FOUND;
          break;
        case 422:
          errorMessage = `Validação falhou: ${errorData.errors?.map((e: any) => e.message).join(', ') || errorMessage}`;
          statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
          break;
      }
    } catch {
      // Se não conseguir parsear o erro, usa mensagem padrão
    }

    throw new HttpException(errorMessage, statusCode);
  }

  async getAuthenticatedUser(token: string) {
    return this.request<{
      id: number;
      login: string;
      name: string;
      email: string;
      avatar_url: string;
      html_url: string;
      type: string;
      company: string | null;
      location: string | null;
      bio: string | null;
    }>('/user', token);
  }

  async listUserRepositories(
    token: string,
    options: {
      perPage?: number;
      page?: number;
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      affiliation?: string;
    } = {},
  ) {
    const params = new URLSearchParams();
    params.append('per_page', (options.perPage || 100).toString());
    params.append('page', (options.page || 1).toString());
    params.append('sort', options.sort || 'updated');
    params.append('direction', options.direction || 'desc');
    params.append(
      'affiliation',
      options.affiliation || 'owner,collaborator,organization_member',
    );

    return this.request<
      Array<{
        id: number;
        name: string;
        full_name: string;
        private: boolean;
        description: string | null;
        html_url: string;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        updated_at: string;
        pushed_at: string;
        default_branch: string;
      }>
    >(`/user/repos?${params.toString()}`, token);
  }

  async getRepository(token: string, owner: string, repo: string) {
    return this.request<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      description: string | null;
      html_url: string;
      language: string | null;
      default_branch: string;
      created_at: string;
      updated_at: string;
      pushed_at: string;
      size: number;
      stargazers_count: number;
      watchers_count: number;
      forks_count: number;
      open_issues_count: number;
    }>(`/repos/${owner}/${repo}`, token);
  }

  async createWebhook(
    token: string,
    owner: string,
    repo: string,
    config: {
      url: string;
      secret?: string;
      events?: string[];
    },
  ) {
    return this.request<{
      id: number;
      url: string;
      test_url: string;
      ping_url: string;
      active: boolean;
      events: string[];
      config: {
        url: string;
        content_type: string;
      };
      created_at: string;
      updated_at: string;
    }>(`/repos/${owner}/${repo}/hooks`, token, {
      method: 'POST',
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: config.events || [
          'push',
          'pull_request',
          'pull_request_review',
          'pull_request_review_comment',
          'issues',
          'issue_comment',
        ],
        config: {
          url: config.url,
          content_type: 'json',
          secret: config.secret || '',
          insecure_ssl: '0',
        },
      }),
    });
  }

  async listWebhooks(token: string, owner: string, repo: string) {
    return this.request<
      Array<{
        id: number;
        url: string;
        active: boolean;
        events: string[];
        config: {
          url: string;
          content_type: string;
        };
        created_at: string;
        updated_at: string;
      }>
    >(`/repos/${owner}/${repo}/hooks`, token);
  }

  async deleteWebhook(
    token: string,
    owner: string,
    repo: string,
    hookId: number,
  ) {
    return this.request(`/repos/${owner}/${repo}/hooks/${hookId}`, token, {
      method: 'DELETE',
    });
  }

  async listCommits(
    token: string,
    owner: string,
    repo: string,
    options: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      perPage?: number;
      page?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (options.sha) params.append('sha', options.sha);
    if (options.path) params.append('path', options.path);
    if (options.author) params.append('author', options.author);
    if (options.since) params.append('since', options.since);
    if (options.until) params.append('until', options.until);
    params.append('per_page', (options.perPage || 30).toString());
    params.append('page', (options.page || 1).toString());

    return this.request<
      Array<{
        sha: string;
        commit: {
          author: {
            name: string;
            email: string;
            date: string;
          };
          committer: {
            name: string;
            email: string;
            date: string;
          };
          message: string;
        };
        author: {
          login: string;
          id: number;
          avatar_url: string;
        } | null;
        html_url: string;
      }>
    >(`/repos/${owner}/${repo}/commits?${params.toString()}`, token);
  }

  async listPullRequests(
    token: string,
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    params.append('state', options.state || 'all');
    params.append('sort', options.sort || 'created');
    params.append('direction', options.direction || 'desc');
    params.append('per_page', (options.perPage || 30).toString());
    params.append('page', (options.page || 1).toString());

    return this.request<
      Array<{
        id: number;
        number: number;
        state: string;
        title: string;
        body: string;
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        merged_at: string | null;
        user: {
          login: string;
          id: number;
          avatar_url: string;
        };
        html_url: string;
        head: {
          ref: string;
          sha: string;
        };
        base: {
          ref: string;
          sha: string;
        };
      }>
    >(`/repos/${owner}/${repo}/pulls?${params.toString()}`, token);
  }

  async getPullRequest(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ) {
    return this.request<{
      id: number;
      number: number;
      state: string;
      title: string;
      body: string;
      created_at: string;
      updated_at: string;
      closed_at: string | null;
      merged_at: string | null;
      merged: boolean;
      mergeable: boolean | null;
      user: {
        login: string;
        id: number;
        avatar_url: string;
      };
      html_url: string;
      additions: number;
      deletions: number;
      changed_files: number;
      comments: number;
      review_comments: number;
      commits: number;
    }>(`/repos/${owner}/${repo}/pulls/${pullNumber}`, token);
  }

  async listPullRequestReviews(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ) {
    return this.request<
      Array<{
        id: number;
        user: {
          login: string;
          id: number;
          avatar_url: string;
        };
        body: string;
        state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
        html_url: string;
        submitted_at: string;
      }>
    >(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, token);
  }

  async listIssues(
    token: string,
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      since?: string;
      perPage?: number;
      page?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    params.append('state', options.state || 'all');
    params.append('sort', options.sort || 'created');
    params.append('direction', options.direction || 'desc');
    if (options.since) params.append('since', options.since);
    params.append('per_page', (options.perPage || 30).toString());
    params.append('page', (options.page || 1).toString());

    return this.request<
      Array<{
        id: number;
        number: number;
        title: string;
        state: string;
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        user: {
          login: string;
          id: number;
          avatar_url: string;
        };
        html_url: string;
        comments: number;
        pull_request?: {
          url: string;
        };
      }>
    >(`/repos/${owner}/${repo}/issues?${params.toString()}`, token);
  }

  async getPullRequestDiff(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullNumber}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': this.apiVersion,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.text();
  }

  async getCommitDiff(
    token: string,
    owner: string,
    repo: string,
    sha: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${sha}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': this.apiVersion,
      },
    });
    if (!response.ok) {
      await this.handleError(response);
    }
    return response.text();
  }
}
