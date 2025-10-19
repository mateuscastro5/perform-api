import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SquadsService } from './squads.service';
import { CreateSquadDto } from './dto/create-squad.dto';
import { UpdateSquadDto } from './dto/update-squad.dto';

@Controller('squads')
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
    return this.squadsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSquadDto: UpdateSquadDto) {
    return this.squadsService.update(+id, updateSquadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.squadsService.remove(+id);
  }
}
