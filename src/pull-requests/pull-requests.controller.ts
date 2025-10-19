import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pull-requests')
@UseGuards(JwtAuthGuard)
export class PullRequestsController {
  constructor(private readonly pullRequestsService: PullRequestsService) {}

  @Post()
  create(@Body() createPullRequestDto: CreatePullRequestDto) {
    return this.pullRequestsService.create(createPullRequestDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pullRequestsService.findAll(status, userId, page, limit);
  }

  @Get('metrics')
  getMetrics(@Query('userId') userId?: string) {
    return this.pullRequestsService.getMetrics(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pullRequestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePullRequestDto: UpdatePullRequestDto,
  ) {
    return this.pullRequestsService.update(id, updatePullRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pullRequestsService.remove(id);
  }
}
