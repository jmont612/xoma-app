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
import { MoodStatesService } from './mood-states.service';
import { CreateMoodStateDto } from './dto/create-mood-state.dto';
import { UpdateMoodStateDto } from './dto/update-mood-state.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Mood States')
@ApiBearerAuth('access-token')
@Controller('mood-states')
@UseGuards(JwtAuthGuard)
export class MoodStatesController {
  constructor(private readonly moodStatesService: MoodStatesService) {}

  @ApiOperation({ summary: 'Crear un estado de ánimo' })
  @ApiResponse({ status: 201, description: 'Estado de ánimo creado' })
  @Post()
  async create(@Body() createMoodStateDto: CreateMoodStateDto) {
    const moodState = await this.moodStatesService.create(createMoodStateDto);
    return apiResponse(moodState, 'Mood state created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los estados de ánimo' })
  @ApiResponse({ status: 200, description: 'Lista de estados de ánimo' })
  @Get()
  async findAll() {
    const moodStates = await this.moodStatesService.findAll();
    return apiResponse(moodStates, 'Mood states retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un estado de ánimo por ID' })
  @ApiResponse({ status: 200, description: 'Estado de ánimo encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const moodState = await this.moodStatesService.findOne(id);
    return apiResponse(moodState, 'Mood state retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un estado de ánimo' })
  @ApiResponse({ status: 200, description: 'Estado de ánimo actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMoodStateDto: UpdateMoodStateDto,
  ) {
    const moodState = await this.moodStatesService.update(
      id,
      updateMoodStateDto,
    );
    return apiResponse(moodState, 'Mood state updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un estado de ánimo (soft delete)' })
  @ApiResponse({ status: 200, description: 'Estado de ánimo eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.moodStatesService.remove(id);
    return apiResponse(null, message);
  }
}
