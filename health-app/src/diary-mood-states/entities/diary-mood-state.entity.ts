import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Diary } from '../../diaries/entities/diary.entity';
import { MoodState } from '../../mood-states/entities/mood-state.entity';

@Entity('diary_mood_states')
export class DiaryMoodState {
  @PrimaryColumn({ name: 'diary_id' })
  diaryId: number;

  @PrimaryColumn({ name: 'mood_state_id' })
  moodStateId: number;

  @ManyToOne(() => Diary)
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @ManyToOne(() => MoodState)
  @JoinColumn({ name: 'mood_state_id' })
  moodState: MoodState;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @DeleteDateColumn()
  deletedAt: Date;
}
