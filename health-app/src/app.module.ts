import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './database/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { MoodStatesModule } from './mood-states/mood-states.module';
import { DiariesModule } from './diaries/diaries.module';
import { BehaviorsModule } from './behaviors/behaviors.module';
import { ReflectionsModule } from './reflections/reflections.module';
import { DailyQuotesModule } from './daily-quotes/daily-quotes.module';
import { EmaTypesModule } from './ema-types/ema-types.module';
import { EmaLogsModule } from './ema-logs/ema-logs.module';
import { SkillsModule } from './skills/skills.module';
import { SubSkillsModule } from './sub-skills/sub-skills.module';
import { StepsModule } from './steps/steps.module';
import { DiaryMoodStatesModule } from './diary-mood-states/diary-mood-states.module';
import { DiaryBehaviorsModule } from './diary-behaviors/diary-behaviors.module';
import { SkillActivitiesModule } from './user-skill-activities/user-skill-activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    AuthModule,
    EmergencyContactsModule,
    MoodStatesModule,
    DiariesModule,
    BehaviorsModule,
    ReflectionsModule,
    DailyQuotesModule,
    EmaTypesModule,
    EmaLogsModule,
    SkillsModule,
    SubSkillsModule,
    StepsModule,
    DiaryMoodStatesModule,
    DiaryBehaviorsModule,
    SkillActivitiesModule,
  ],
})
export class AppModule {}
