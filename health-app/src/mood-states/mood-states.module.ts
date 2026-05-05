import { Module } from '@nestjs/common';
import { MoodStatesService } from './mood-states.service';
import { MoodStatesController } from './mood-states.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodState } from './entities/mood-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MoodState])],
  controllers: [MoodStatesController],
  providers: [MoodStatesService],
  exports: [MoodStatesService],
})
export class MoodStatesModule {}
