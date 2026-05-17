import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';
import { Diary } from '../../diaries/entities/diary.entity';
import { Behavior } from '../../behaviors/entities/behavior.entity';

@Entity('diary_behaviors')
export class DiaryBehavior {
  @PrimaryColumn({ name: 'diary_id' })
  diaryId: number;

  @PrimaryColumn({ name: 'behavior_id' })
  behaviorId: number;

  @ManyToOne(() => Diary)
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @ManyToOne(() => Behavior)
  @JoinColumn({ name: 'behavior_id' })
  behavior: Behavior;

  @Column()
  hasHappened: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
