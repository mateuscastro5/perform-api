import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GithubWebhookService } from './github-webhook.service';
import { CreateGithubWebhookDto } from './dto/create-github-webhook.dto';
import { UpdateGithubWebhookDto } from './dto/update-github-webhook.dto';

@Controller('github-webhook')
export class GithubWebhookController {
  constructor(private readonly githubWebhookService: GithubWebhookService) {}

  @Post()
  create(@Body() createGithubWebhookDto: CreateGithubWebhookDto) {
    return this.githubWebhookService.create(createGithubWebhookDto);
  }

  @Get()
  findAll() {
    return this.githubWebhookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.githubWebhookService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGithubWebhookDto: UpdateGithubWebhookDto,
  ) {
    return this.githubWebhookService.update(+id, updateGithubWebhookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.githubWebhookService.remove(+id);
  }
}
