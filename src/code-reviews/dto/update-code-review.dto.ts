import { PartialType } from '@nestjs/mapped-types';
import { CreateCodeReviewDto } from './create-code-review.dto';

export class UpdateCodeReviewDto extends PartialType(CreateCodeReviewDto) {}
