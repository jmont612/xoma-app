import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubSkill } from '../../sub-skills/entities/sub-skill.entity';
import { UserSkillActivityStatus } from '../../common/enums/diary-skill-activity-status.enum';

@Entity('user_skill_activities')
export class UserSkillActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.skillActivities)
  user: User;

  @ManyToOne(() => SubSkill, (subSkill) => subSkill.userSkillActivities)
  @JoinColumn({ name: 'sub_skill_id' })
  subSkill: SubSkill;

  @Column({
    type: 'varchar',
    enum: UserSkillActivityStatus,
  })
  status: UserSkillActivityStatus;

  @Column({ type: 'boolean', nullable: true })
  effective: boolean;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
