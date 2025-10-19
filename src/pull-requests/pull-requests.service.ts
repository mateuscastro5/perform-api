import { Injectable } from '@nestjs/common';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';

@Injectable()
export class PullRequestsService {
  create(createPullRequestDto: CreatePullRequestDto) {
    return 'This action adds a new pullRequest';
  }

  findAll() {
    return `This action returns all pullRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pullRequest`;
  }

  update(id: number, updatePullRequestDto: UpdatePullRequestDto) {
    return `This action updates a #${id} pullRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} pullRequest`;
  }
}
