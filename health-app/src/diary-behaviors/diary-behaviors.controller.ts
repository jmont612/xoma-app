import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DiaryBehaviorsService } from './diary-behaviors.service';
import { CreateDiaryBehaviorDto } from './dto/create-diary-behavior.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('diary-behaviors')
@UseGuards(JwtAuthGuard)
export class DiaryBehaviorsController {
  constructor(private readonly diaryBehaviorsService: DiaryBehaviorsService) {}

  @Post()
  async create(@Body() createDiaryBehaviorDto: CreateDiaryBehaviorDto) {
    const diaryBehavior = await this.diaryBehaviorsService.create(
      createDiaryBehaviorDto,
    );
    return apiResponse(diaryBehavior, 'Diary behavior created successfully');
  }

  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const diaryBehaviors =
      await this.diaryBehaviorsService.findByDiaryId(diaryId);
    return apiResponse(
      diaryBehaviors,
      'Diary behaviors retrieved successfully',
    );
  }

  @Delete(':diaryId/:behaviorId')
  async remove(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @Param('behaviorId', ParseIntPipe) behaviorId: number,
  ) {
    const message = await this.diaryBehaviorsService.remove(
      diaryId,
      behaviorId,
    );
    return apiResponse(null, message);
  }
}
