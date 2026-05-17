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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DiaryMoodStatesService } from './diary-mood-states.service';
import { CreateDiaryMoodStateDto } from './dto/create-diary-mood-state.dto';
import { UpdateDiaryMoodStateDto } from './dto/update-diary-mood-state.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Diary Mood States')
@ApiBearerAuth('access-token')
@Controller('diary-mood-states')
@UseGuards(JwtAuthGuard)
export class DiaryMoodStatesController {
  constructor(
    private readonly diaryMoodStatesService: DiaryMoodStatesService,
  ) {}

  @ApiOperation({
    summary: 'Registrar un estado de ánimo en una entrada de diario',
  })
  @ApiResponse({ status: 201, description: 'Estado de ánimo registrado' })
  @Post()
  async create(@Body() createDiaryMoodStateDto: CreateDiaryMoodStateDto) {
    const diaryMoodState = await this.diaryMoodStatesService.create(
      createDiaryMoodStateDto,
    );
    return apiResponse(diaryMoodState, 'Diary mood state created successfully');
  }

  @ApiOperation({
    summary: 'Obtener estados de ánimo de una entrada de diario',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estados de ánimo del diario',
  })
  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const diaryMoodStates =
      await this.diaryMoodStatesService.findByDiaryId(diaryId);
    return apiResponse(
      diaryMoodStates,
      'Diary mood states retrieved successfully',
    );
  }

  @ApiOperation({
    summary: 'Actualizar la puntuación de un estado de ánimo en el diario',
  })
  @ApiResponse({ status: 200, description: 'Estado de ánimo actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
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

  @ApiOperation({
    summary: 'Eliminar un estado de ánimo de una entrada de diario',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de ánimo eliminado del diario',
  })
  @ApiResponse({ status: 404, description: 'No encontrado' })
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
