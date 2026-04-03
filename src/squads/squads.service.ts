import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSquadDto } from './dto/create-squad.dto';
import { UpdateSquadDto } from './dto/update-squad.dto';
import { Squad } from './entities/squad.entity';

@Injectable()
export class SquadsService {
  constructor(
    @InjectRepository(Squad)
    private squadsRepository: Repository<Squad>,
  ) {}

  create(createSquadDto: CreateSquadDto) {
    return this.squadsRepository.save(createSquadDto);
  }

  findAll() {
    return this.squadsRepository.find({
      relations: ['members', 'techLead', 'developers'],
      where: { active: true },
    });
  }

  findOne(id: string) {
    return this.squadsRepository.findOne({
      where: { id },
      relations: ['members', 'techLead', 'developers'],
    });
  }

  async getMembers(id: string) {
    const squad = await this.squadsRepository.findOne({
      where: { id },
      relations: ['members', 'members.squad'],
    });

    if (!squad) {
      return { members: [], total: 0 };
    }

    const membersWithActivity = squad.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: 'active' as const,
      lastActivity: new Date().toISOString(),
      currentTask: null,
    }));

    return {
      members: membersWithActivity,
      total: membersWithActivity.length,
      activeCount: membersWithActivity.filter((m) => m.status === 'active')
        .length,
      codingCount: 0,
      awayCount: 0,
    };
  }

  async getActivity(id: string) {
    // For now, return empty activity data
    // This will be populated when we integrate with GitHub webhooks
    return {
      recentCommits: [],
      recentPRs: [],
      weeklyProductivity: {
        commits: 0,
        prsMerged: 0,
        codeReviews: 0,
      },
    };
  }

  update(id: string, updateSquadDto: UpdateSquadDto) {
    return this.squadsRepository.update(id, updateSquadDto);
  }

  remove(id: string) {
    return this.squadsRepository.softDelete(id);
  }
}
