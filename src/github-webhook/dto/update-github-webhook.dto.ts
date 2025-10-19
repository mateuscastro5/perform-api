import { PartialType } from '@nestjs/mapped-types';
import { CreateGithubWebhookDto } from './create-github-webhook.dto';

export class UpdateGithubWebhookDto extends PartialType(
  CreateGithubWebhookDto,
) {}
