import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SquadsService } from './squads.service';
import { CreateSquadDto } from './dto/create-squad.dto';
import { UpdateSquadDto } from './dto/update-squad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('squads')
@UseGuards(JwtAuthGuard)
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  create(@Body() createSquadDto: CreateSquadDto) {
    return this.squadsService.create(createSquadDto);
  }

  @Get()
  findAll() {
    return this.squadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.squadsService.findOne(id);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.squadsService.getMembers(id);
  }

  @Get(':id/activity')
  getActivity(@Param('id') id: string) {
    return this.squadsService.getActivity(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSquadDto: UpdateSquadDto) {
    return this.squadsService.update(id, updateSquadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.squadsService.remove(id);
  }
}
