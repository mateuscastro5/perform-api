import { Module } from '@nestjs/common';
import { CodeReviewsService } from './code-reviews.service';
import { CodeReviewsController } from './code-reviews.controller';

@Module({
  controllers: [CodeReviewsController],
  providers: [CodeReviewsService],
})
export class CodeReviewsModule {}
