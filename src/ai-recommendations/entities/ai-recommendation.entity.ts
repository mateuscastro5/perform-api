import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Developer } from '../../developers/entities/developer.entity';

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum RecommendationCategory {
  PRODUCTIVITY = 'productivity',
  CODE_QUALITY = 'code_quality',
  COLLABORATION = 'collaboration',
  LEARNING = 'learning',
  PERFORMANCE = 'performance',
}

@Entity('ai_recommendations')
export class AIRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: RecommendationCategory,
  })
  category: RecommendationCategory;

  @Column({
    type: 'enum',
    enum: RecommendationPriority,
    default: RecommendationPriority.MEDIUM,
  })
  priority: RecommendationPriority;

  @Column({ name: 'model_version', nullable: true })
  modelVersion: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ default: false })
  acknowledged: boolean;

  @ManyToOne(() => Developer, { nullable: true })
  developer: Developer;
}
