import { DataSourceOptions } from 'typeorm';
import { Auth } from '@/auth/entities/auth.entity';
import { Behavior } from '@/behaviors/entities/behavior.entity';
import { DailyQuote } from '@/daily-quotes/entities/daily-quote.entity';
import { Diary } from '@/diaries/entities/diary.entity';
import { DiaryBehavior } from '@/diary-behaviors/entities/diary-behavior.entity';
import { DiaryMoodState } from '@/diary-mood-states/entities/diary-mood-state.entity';
import { EmaLog } from '@/ema-logs/entities/ema-log.entity';
import { EmaType } from '@/ema-types/entities/ema-type.entity';
import { EmergencyContact } from '@/emergency-contacts/entities/emergency-contact.entity';
import { MoodState } from '@/mood-states/entities/mood-state.entity';
import { Reflection } from '@/reflections/entities/reflection.entity';
import { Skill } from '@/skills/entities/skill.entity';
import { Step } from '@/steps/entities/step.entity';
import { SubSkill } from '@/sub-skills/entities/sub-skill.entity';
import { UserSkillActivity } from '@/user-skill-activities/entities/user-skill-activity.entity';
import { User } from '@/users/entities/user.entity';
import { InitialMigration1778977220720 } from '@/migrations/1778977220720-InitialMigration';

process.loadEnvFile?.('.env');

const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Entidades listadas explícitamente para compatibilidad con webpack bundle
  entities: [
    Auth,
    Behavior,
    DailyQuote,
    Diary,
    DiaryBehavior,
    DiaryMoodState,
    EmaLog,
    EmaType,
    EmergencyContact,
    MoodState,
    Reflection,
    Skill,
    Step,
    SubSkill,
    UserSkillActivity,
    User,
  ],
  migrations: [InitialMigration1778977220720],
  migrationsTableName: 'db_migrations',
  synchronize: false,
  logging: true,
};

export default databaseConfig;
