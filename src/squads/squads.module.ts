import { Module } from '@nestjs/common';
import { SquadsService } from './squads.service';
import { SquadsController } from './squads.controller';

@Module({
  controllers: [SquadsController],
  providers: [SquadsService],
})
export class SquadsModule {}
