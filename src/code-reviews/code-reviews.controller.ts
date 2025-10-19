import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CodeReviewsService } from './code-reviews.service';
import { CreateCodeReviewDto } from './dto/create-code-review.dto';
import { UpdateCodeReviewDto } from './dto/update-code-review.dto';

@Controller('code-reviews')
export class CodeReviewsController {
  constructor(private readonly codeReviewsService: CodeReviewsService) {}

  @Post()
  create(@Body() createCodeReviewDto: CreateCodeReviewDto) {
    return this.codeReviewsService.create(createCodeReviewDto);
  }

  @Get()
  findAll() {
    return this.codeReviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.codeReviewsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCodeReviewDto: UpdateCodeReviewDto,
  ) {
    return this.codeReviewsService.update(+id, updateCodeReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.codeReviewsService.remove(+id);
  }
}
