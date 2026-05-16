import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DiaryMoodStatesService } from './diary-mood-states.service';
import { CreateDiaryMoodStateDto } from './dto/create-diary-mood-state.dto';
import { UpdateDiaryMoodStateDto } from './dto/update-diary-mood-state.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('diary-mood-states')
@UseGuards(JwtAuthGuard)
export class DiaryMoodStatesController {
  constructor(
    private readonly diaryMoodStatesService: DiaryMoodStatesService,
  ) {}

  @Post()
  async create(@Body() createDiaryMoodStateDto: CreateDiaryMoodStateDto) {
    const diaryMoodState = await this.diaryMoodStatesService.create(
      createDiaryMoodStateDto,
    );
    return apiResponse(diaryMoodState, 'Diary mood state created successfully');
  }

  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const diaryMoodStates =
      await this.diaryMoodStatesService.findByDiaryId(diaryId);
    return apiResponse(
      diaryMoodStates,
      'Diary mood states retrieved successfully',
    );
  }

  @Patch(':diaryId/:moodStateId')
  async update(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @Param('moodStateId', ParseIntPipe) moodStateId: number,
    @Body() updateDiaryMoodStateDto: UpdateDiaryMoodStateDto,
  ) {
    const diaryMoodState = await this.diaryMoodStatesService.update(
      diaryId,
      moodStateId,
      updateDiaryMoodStateDto,
    );
    return apiResponse(diaryMoodState, 'Diary mood state updated successfully');
  }

  @Delete(':diaryId/:moodStateId')
  async remove(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @Param('moodStateId', ParseIntPipe) moodStateId: number,
  ) {
    const message = await this.diaryMoodStatesService.remove(
      diaryId,
      moodStateId,
    );
    return apiResponse(null, message);
  }
}
