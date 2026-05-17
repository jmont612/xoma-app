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
import { ReflectionsService } from './reflections.service';
import { CreateReflectionDto } from './dto/create-reflection.dto';
import { UpdateReflectionDto } from './dto/update-reflection.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Reflections')
@ApiBearerAuth('access-token')
@Controller('reflections')
@UseGuards(JwtAuthGuard)
export class ReflectionsController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @ApiOperation({ summary: 'Crear una reflexión diaria' })
  @ApiResponse({ status: 201, description: 'Reflexión creada' })
  @Post()
  async create(@Body() createReflectionDto: CreateReflectionDto) {
    const reflection =
      await this.reflectionsService.create(createReflectionDto);
    return apiResponse(reflection, 'Reflection created successfully');
  }

  @ApiOperation({ summary: 'Obtener todas las reflexiones' })
  @ApiResponse({ status: 200, description: 'Lista de reflexiones' })
  @Get()
  async findAll() {
    const reflections = await this.reflectionsService.findAll();
    return apiResponse(reflections, 'Reflections retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener reflexiones de una entrada de diario' })
  @ApiResponse({ status: 200, description: 'Reflexiones del diario' })
  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const reflections = await this.reflectionsService.findByDiaryId(diaryId);
    return apiResponse(reflections, 'Diary reflections retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener una reflexión por ID' })
  @ApiResponse({ status: 200, description: 'Reflexión encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reflection = await this.reflectionsService.findOne(id);
    return apiResponse(reflection, 'Reflection retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar una reflexión' })
  @ApiResponse({ status: 200, description: 'Reflexión actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReflectionDto: UpdateReflectionDto,
  ) {
    const reflection = await this.reflectionsService.update(
      id,
      updateReflectionDto,
    );
    return apiResponse(reflection, 'Reflection updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar una reflexión (soft delete)' })
  @ApiResponse({ status: 200, description: 'Reflexión eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.reflectionsService.remove(id);
    return apiResponse(null, message);
  }
}
