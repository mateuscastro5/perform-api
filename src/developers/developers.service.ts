import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { Developer } from './entities/developer.entity';

@Injectable()
export class DevelopersService {
  constructor(
    @InjectRepository(Developer)
    private readonly developerRepository: Repository<Developer>,
  ) {}

  create(createDeveloperDto: CreateDeveloperDto) {
    return this.developerRepository.save(createDeveloperDto);
  }

  findAll() {
    return this.developerRepository.find();
  }

  findOne(id: string) {
    return this.developerRepository.findOne({ where: { id } });
  }

  async update(id: string, updateDeveloperDto: UpdateDeveloperDto) {
    const developer = await this.developerRepository.preload({
      id,
      ...updateDeveloperDto,
    });

    if (!developer) {
      throw new NotFoundException(`Developer #${id} not found`);
    }

    return this.developerRepository.save(developer);
  }

  remove(id: string) {
    return this.developerRepository.softDelete(id);
  }
}
