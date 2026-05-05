import { Module } from '@nestjs/common';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from './entities/diary.entity';
import { DiaryMoodStatesModule } from 'src/diary-mood-states/diary-mood-states.module';
import { DiaryBehaviorsModule } from 'src/diary-behaviors/diary-behaviors.module';
import { SkillActivitiesModule } from 'src/user-skill-activities/user-skill-activities.module';
import { ReflectionsModule } from 'src/reflections/reflections.module';
import { UsersModule } from 'src/users/users.module';

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
