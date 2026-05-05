import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSkillActivity } from './entities/user-skill-activity.entity';
import { UserSkillActivitiesService } from './user-skill-activities.service';
import { SkillActivitiesController } from './user-skill-activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserSkillActivity])],
  controllers: [SkillActivitiesController],
  providers: [UserSkillActivitiesService],
  exports: [UserSkillActivitiesService],
})
export class SkillActivitiesModule {}
