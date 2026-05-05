import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Step } from '../../steps/entities/step.entity';
import { UserSkillActivity } from '../../user-skill-activities/entities/user-skill-activity.entity';

@Entity('sub_skills')
export class SubSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Skill, (skill) => skill.subSkills)
  @JoinColumn()
  skill: Skill;

  @Column({ type: 'text' })
  name: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Step, (step) => step.subSkill)
  steps: Step[];

  @OneToMany(
    () => UserSkillActivity,
    (userSkillActivity) => userSkillActivity.subSkill,
  )
  userSkillActivities: UserSkillActivity[];
}
