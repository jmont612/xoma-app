import { Module } from '@nestjs/common';
import { EmaLogsService } from './ema-logs.service';
import { EmaLogsController } from './ema-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmaLog } from './entities/ema-log.entity';
import { EmaType } from '@/ema-types/entities/ema-type.entity';
import { SubSkill } from '@/sub-skills/entities/sub-skill.entity';
import { UserSkillActivity } from '@/user-skill-activities/entities/user-skill-activity.entity';
import { Step } from '@/steps/entities/step.entity';
import { EmergencyContact } from '@/emergency-contacts/entities/emergency-contact.entity';
import { MlPredictionModule } from '@/ml-prediction/ml-prediction.module';
import { UsersModule } from '@/users/users.module';
import { EmaTypesModule } from '@/ema-types/ema-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmaLog,
      EmaType,
      SubSkill,
      UserSkillActivity,
      Step,
      EmergencyContact,
    ]),
    UsersModule,
    EmaTypesModule,
    MlPredictionModule,
  ],
  controllers: [EmaLogsController],
  providers: [EmaLogsService],
  exports: [EmaLogsService],
})
export class EmaLogsModule {}
