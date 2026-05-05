import { Module } from '@nestjs/common';
import { EmaTypesService } from './ema-types.service';
import { EmaTypesController } from './ema-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmaType } from './entities/ema-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmaType])],
  controllers: [EmaTypesController],
  providers: [EmaTypesService],
  exports: [EmaTypesService],
})
export class EmaTypesModule {}
