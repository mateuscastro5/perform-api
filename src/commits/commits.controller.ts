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
import { CommitsService } from './commits.service';
import { CreateCommitDto } from './dto/create-commit.dto';
import { UpdateCommitDto } from './dto/update-commit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('commits')
@UseGuards(JwtAuthGuard)
export class CommitsController {
  constructor(private readonly commitsService: CommitsService) {}

  @Post()
  create(@Body() createCommitDto: CreateCommitDto) {
    return this.commitsService.create(createCommitDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.commitsService.findAll(userId);
  }

  @Get('metrics')
  getMetrics(@Query('userId') userId?: string) {
    return this.commitsService.getMetrics(userId);
  }

  @Get('weekly')
  getWeeklyData(@Query('userId') userId?: string) {
    return this.commitsService.getWeeklyData(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommitDto: UpdateCommitDto) {
    return this.commitsService.update(id, updateCommitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commitsService.remove(id);
  }
}
