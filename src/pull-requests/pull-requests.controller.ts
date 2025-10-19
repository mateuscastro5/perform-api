import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';

@Controller('pull-requests')
export class PullRequestsController {
  constructor(private readonly pullRequestsService: PullRequestsService) {}

  @Post()
  create(@Body() createPullRequestDto: CreatePullRequestDto) {
    return this.pullRequestsService.create(createPullRequestDto);
  }

  @Get()
  findAll() {
    return this.pullRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pullRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePullRequestDto: UpdatePullRequestDto,
  ) {
    return this.pullRequestsService.update(+id, updatePullRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pullRequestsService.remove(+id);
  }
}
