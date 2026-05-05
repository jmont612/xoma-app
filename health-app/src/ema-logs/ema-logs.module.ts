import { Module } from '@nestjs/common';
import { EmaLogsService } from './ema-logs.service';
import { EmaLogsController } from './ema-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmaLog } from './entities/ema-log.entity';
import { EmaType } from 'src/ema-types/entities/ema-type.entity';
import { SubSkill } from 'src/sub-skills/entities/sub-skill.entity';
import { UserSkillActivity } from 'src/user-skill-activities/entities/user-skill-activity.entity';
import { Step } from 'src/steps/entities/step.entity';
import { EmergencyContact } from 'src/emergency-contacts/entities/emergency-contact.entity';
import { MlPredictionModule } from 'src/ml-prediction/ml-prediction.module';
import { UsersModule } from 'src/users/users.module';
import { EmaTypesModule } from 'src/ema-types/ema-types.module';

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
