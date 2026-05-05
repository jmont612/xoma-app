import { Module } from '@nestjs/common';
import { BehaviorsService } from './behaviors.service';
import { BehaviorsController } from './behaviors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Behavior } from './entities/behavior.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Behavior])],
  controllers: [BehaviorsController],
  providers: [BehaviorsService],
  exports: [BehaviorsService],
})
export class BehaviorsModule {}
