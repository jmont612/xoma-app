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
import { DiariesService } from './diaries.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Diaries')
@ApiBearerAuth('access-token')
@Controller('diaries')
@UseGuards(JwtAuthGuard)
export class DiariesController {
  constructor(private readonly diariesService: DiariesService) {}

  @ApiOperation({ summary: 'Crear una entrada de diario emocional' })
  @ApiResponse({
    status: 201,
    description:
      'Entrada creada con estados de ánimo, comportamientos y reflexión',
  })
  @Post()
  async create(@Body() createDiaryDto: CreateDiaryDto) {
    const diary = await this.diariesService.create(createDiaryDto);
    return apiResponse(diary, 'Diary entry created successfully');
  }

  @ApiOperation({ summary: 'Obtener todas las entradas de diario' })
  @ApiResponse({ status: 200, description: 'Lista de entradas de diario' })
  @Get()
  async findAll() {
    const diaries = await this.diariesService.findAll();
    return apiResponse(diaries, 'Diary entries retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener racha semanal de diario de un usuario' })
  @ApiResponse({
    status: 200,
    description:
      'Racha semanal: días con entrada en los últimos 7 días y racha consecutiva',
  })
  @Get('user/:userId/weekly-streak')
  async getWeeklyStreak(@Param('userId', ParseIntPipe) userId: number) {
    const streak = await this.diariesService.getWeeklyStreak(userId);
    return apiResponse(streak, 'Weekly streak retrieved successfully');
  }

  @ApiOperation({
    summary: 'Obtener todas las entradas de diario de un usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de entradas de diario del usuario',
  })
  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const diaries = await this.diariesService.findByUserId(userId);
    return apiResponse(diaries, 'User diary entries retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener una entrada de diario por ID' })
  @ApiResponse({ status: 200, description: 'Entrada encontrada' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const diary = await this.diariesService.findOne(id);
    return apiResponse(diary, 'Diary entry retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar una entrada de diario' })
  @ApiResponse({
    status: 200,
    description:
      'Entrada actualizada con upsert de estados de ánimo y comportamientos',
  })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    const diary = await this.diariesService.update(id, updateDiaryDto);
    return apiResponse(diary, 'Diary entry updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar una entrada de diario (soft delete)' })
  @ApiResponse({ status: 200, description: 'Entrada eliminada' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.diariesService.remove(id);
    return apiResponse(null, message);
  }
}
