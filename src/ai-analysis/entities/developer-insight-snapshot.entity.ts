import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Developer } from '../../developers/entities/developer.entity';

@Entity('developer_insight_snapshots')
export class DeveloperInsightSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'developer_id', type: 'uuid' })
  developerId: string;

  @ManyToOne(() => Developer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'developer_id' })
  developer: Developer;

  @Column({ name: 'summary_text', type: 'text', default: '' })
  summaryText: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  strengths: string[];

  @Column({ name: 'growth_areas', type: 'jsonb', default: () => "'[]'" })
  growthAreas: string[];

  @Column({ name: 'dominant_technologies', type: 'jsonb', default: () => "'[]'" })
  dominantTechnologies: string[];

  @Column({ name: 'trend_narrative', type: 'text', default: '' })
  trendNarrative: string;

  @Column({ name: 'memory_count_at_generation', type: 'integer', default: 0 })
  memoryCountAtGeneration: number;

  @Column({ name: 'analyses_count_at_generation', type: 'integer', default: 0 })
  analysesCountAtGeneration: number;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
