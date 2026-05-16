import { Module } from '@nestjs/common';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from './entities/diary.entity';
import { DiaryMoodStatesModule } from '@/diary-mood-states/diary-mood-states.module';
import { DiaryBehaviorsModule } from '@/diary-behaviors/diary-behaviors.module';
import { SkillActivitiesModule } from '@/user-skill-activities/user-skill-activities.module';
import { ReflectionsModule } from '@/reflections/reflections.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diary]),
    DiaryMoodStatesModule,
    DiaryBehaviorsModule,
    SkillActivitiesModule,
    ReflectionsModule,
    UsersModule,
  ],
  controllers: [DiariesController],
  providers: [DiariesService],
  exports: [DiariesService],
})
export class DiariesModule {}
