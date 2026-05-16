import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MlPredictionService } from './ml-prediction.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MlPredictionService],
  exports: [MlPredictionService],
})
export class MlPredictionModule {}
