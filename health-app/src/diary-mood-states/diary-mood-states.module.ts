import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryMoodState } from './entities/diary-mood-state.entity';
import { DiaryMoodStatesService } from './diary-mood-states.service';
import { DiaryMoodStatesController } from './diary-mood-states.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryMoodState])],
  controllers: [DiaryMoodStatesController],
  providers: [DiaryMoodStatesService],
  exports: [DiaryMoodStatesService],
})
export class DiaryMoodStatesModule {}
