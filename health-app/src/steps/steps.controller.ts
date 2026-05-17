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
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Steps')
@ApiBearerAuth('access-token')
@Controller('steps')
@UseGuards(JwtAuthGuard)
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @ApiOperation({ summary: 'Crear un paso de una sub-habilidad' })
  @ApiResponse({ status: 201, description: 'Paso creado' })
  @Post()
  async create(@Body() createStepDto: CreateStepDto) {
    const step = await this.stepsService.create(createStepDto);
    return apiResponse(step, 'Step created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los pasos' })
  @ApiResponse({ status: 200, description: 'Lista de pasos' })
  @Get()
  async findAll() {
    const steps = await this.stepsService.findAll();
    return apiResponse(steps, 'Steps retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener pasos de una sub-habilidad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pasos de la sub-habilidad',
  })
  @Get('sub-skill/:subSkillId')
  async findBySubSkillId(
    @Param('subSkillId', ParseIntPipe) subSkillId: number,
  ) {
    const steps = await this.stepsService.findBySubSkillId(subSkillId);
    return apiResponse(steps, 'Sub-skill steps retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un paso por ID' })
  @ApiResponse({ status: 200, description: 'Paso encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const step = await this.stepsService.findOne(id);
    return apiResponse(step, 'Step retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un paso' })
  @ApiResponse({ status: 200, description: 'Paso actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStepDto: UpdateStepDto,
  ) {
    const step = await this.stepsService.update(id, updateStepDto);
    return apiResponse(step, 'Step updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un paso (soft delete)' })
  @ApiResponse({ status: 200, description: 'Paso eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.stepsService.remove(id);
    return apiResponse(null, message);
  }
}
