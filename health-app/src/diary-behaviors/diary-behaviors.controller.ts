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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DiaryBehaviorsService } from './diary-behaviors.service';
import { CreateDiaryBehaviorDto } from './dto/create-diary-behavior.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Diary Behaviors')
@ApiBearerAuth('access-token')
@Controller('diary-behaviors')
@UseGuards(JwtAuthGuard)
export class DiaryBehaviorsController {
  constructor(private readonly diaryBehaviorsService: DiaryBehaviorsService) {}

  @ApiOperation({
    summary: 'Registrar un comportamiento en una entrada de diario',
  })
  @ApiResponse({
    status: 201,
    description: 'Comportamiento registrado en el diario',
  })
  @Post()
  async create(@Body() createDiaryBehaviorDto: CreateDiaryBehaviorDto) {
    const diaryBehavior = await this.diaryBehaviorsService.create(
      createDiaryBehaviorDto,
    );
    return apiResponse(diaryBehavior, 'Diary behavior created successfully');
  }

  @ApiOperation({ summary: 'Obtener comportamientos de una entrada de diario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de comportamientos del diario',
  })
  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const diaryBehaviors =
      await this.diaryBehaviorsService.findByDiaryId(diaryId);
    return apiResponse(
      diaryBehaviors,
      'Diary behaviors retrieved successfully',
    );
  }

  @ApiOperation({
    summary: 'Eliminar un comportamiento de una entrada de diario',
  })
  @ApiResponse({
    status: 200,
    description: 'Comportamiento eliminado del diario',
  })
  @ApiResponse({ status: 404, description: 'No encontrado' })
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
