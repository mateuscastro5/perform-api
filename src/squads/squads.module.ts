import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SquadsService } from './squads.service';
import { SquadsController } from './squads.controller';
import { Squad } from './entities/squad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Squad])],
  controllers: [SquadsController],
  providers: [SquadsService],
  exports: [SquadsService],
})
export class SquadsModule {}
