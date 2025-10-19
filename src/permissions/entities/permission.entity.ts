import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum PermissionType {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_INDIVIDUAL_METRICS = 'view_individual_metrics',
  VIEW_SQUAD_METRICS = 'view_squad_metrics',
  COMPARE_PERFORMANCE = 'compare_performance',
  EXPORT_REPORTS = 'export_reports',
  MANAGE_PERMISSIONS = 'manage_permissions',
  MANAGE_USERS = 'manage_users',
  MANAGE_SQUADS = 'manage_squads',
  VIEW_AI_RECOMMENDATIONS = 'view_ai_recommendations',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
  @Column({
    type: 'enum',
    enum: PermissionType,
    unique: true,
  })
  type: PermissionType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
