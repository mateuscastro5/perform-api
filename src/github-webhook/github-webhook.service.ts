import { Injectable } from '@nestjs/common';
import { CreateGithubWebhookDto } from './dto/create-github-webhook.dto';
import { UpdateGithubWebhookDto } from './dto/update-github-webhook.dto';

@Injectable()
export class GithubWebhookService {
  create(createGithubWebhookDto: CreateGithubWebhookDto) {
    return 'This action adds a new githubWebhook';
  }

  findAll() {
    return `This action returns all githubWebhook`;
  }

  findOne(id: number) {
    return `This action returns a #${id} githubWebhook`;
  }

  update(id: number, updateGithubWebhookDto: UpdateGithubWebhookDto) {
    return `This action updates a #${id} githubWebhook`;
  }

  remove(id: number) {
    return `This action removes a #${id} githubWebhook`;
  }
}
