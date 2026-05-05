import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Gender } from '../../common/enums/gender.enum';
import { EmergencyContact } from '../../emergency-contacts/entities/emergency-contact.entity';
import { Diary } from '../../diaries/entities/diary.entity';
import { EmaLog } from '../../ema-logs/entities/ema-log.entity';
import { UserSkillActivity } from '../../user-skill-activities/entities/user-skill-activity.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'boolean' })
  consentAccepted: boolean;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => EmergencyContact, (contact) => contact.user)
  emergencyContacts: EmergencyContact[];

  @OneToMany(() => Diary, (diary) => diary.user)
  diaries: Diary[];

  @OneToMany(() => EmaLog, (log) => log.user)
  emaLogs: EmaLog[];

  @OneToMany(() => UserSkillActivity, (skillActivity) => skillActivity.user)
  skillActivities: UserSkillActivity[];
}
