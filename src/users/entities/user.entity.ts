import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Squad } from '../../squads/entities/squad.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export enum UserRole {
  ADMIN = 'admin',
  TECH_LEAD = 'tech_lead',
  DEVELOPER = 'developer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DEVELOPER,
  })
  role: UserRole;

  @Column({ type: 'varchar', name: 'github_username', nullable: true })
  githubUsername: string | null;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Squad, (squad) => squad.members, { nullable: true })
  squad: Squad;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'user_permissions',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];
}
