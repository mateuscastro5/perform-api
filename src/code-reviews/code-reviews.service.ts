import { Injectable } from '@nestjs/common';
import { CreateCodeReviewDto } from './dto/create-code-review.dto';
import { UpdateCodeReviewDto } from './dto/update-code-review.dto';

@Injectable()
export class CodeReviewsService {
  create(createCodeReviewDto: CreateCodeReviewDto) {
    return 'This action adds a new codeReview';
  }

  findAll() {
    return `This action returns all codeReviews`;
  }

  findOne(id: number) {
    return `This action returns a #${id} codeReview`;
  }

  update(id: number, updateCodeReviewDto: UpdateCodeReviewDto) {
    return `This action updates a #${id} codeReview`;
  }

  remove(id: number) {
    return `This action removes a #${id} codeReview`;
  }
}
