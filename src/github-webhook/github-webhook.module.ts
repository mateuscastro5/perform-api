import { Module } from '@nestjs/common';
import { GithubWebhookService } from './github-webhook.service';
import { GithubWebhookController } from './github-webhook.controller';

@Module({
  controllers: [GithubWebhookController],
  providers: [GithubWebhookService],
})
export class GithubWebhookModule {}
