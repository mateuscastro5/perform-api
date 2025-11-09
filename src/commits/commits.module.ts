import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitsService } from './commits.service';
import { CommitsController } from './commits.controller';
import { Commit } from './entities/commit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commit])],
  controllers: [CommitsController],
  providers: [CommitsService],
  exports: [CommitsService],
})
export class CommitsModule {}
