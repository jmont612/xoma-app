import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryBehavior } from './entities/diary-behavior.entity';
import { DiaryBehaviorsService } from './diary-behaviors.service';
import { DiaryBehaviorsController } from './diary-behaviors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryBehavior])],
  controllers: [DiaryBehaviorsController],
  providers: [DiaryBehaviorsService],
  exports: [DiaryBehaviorsService],
})
export class DiaryBehaviorsModule {}
