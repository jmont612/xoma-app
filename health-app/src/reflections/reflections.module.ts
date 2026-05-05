import { Module } from '@nestjs/common';
import { ReflectionsService } from './reflections.service';
import { ReflectionsController } from './reflections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflection } from './entities/reflection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reflection])],
  controllers: [ReflectionsController],
  providers: [ReflectionsService],
  exports: [ReflectionsService],
})
export class ReflectionsModule {}
