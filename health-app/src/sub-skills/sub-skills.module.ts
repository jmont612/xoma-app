import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubSkill } from './entities/sub-skill.entity';
import { SubSkillsService } from './sub-skills.service';
import { SubSkillsController } from './sub-skills.controller';
import { SkillsModule } from '@/skills/skills.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubSkill]), SkillsModule],
  controllers: [SubSkillsController],
  providers: [SubSkillsService],
  exports: [SubSkillsService],
})
export class SubSkillsModule {}
