import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from './entities/step.entity';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';
import { SubSkillsModule } from '@/sub-skills/sub-skills.module';

@Module({
  imports: [TypeOrmModule.forFeature([Step]), SubSkillsModule],
  controllers: [StepsController],
  providers: [StepsService],
  exports: [StepsService],
})
export class StepsModule {}
