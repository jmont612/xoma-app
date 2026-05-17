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
import { BehaviorsService } from './behaviors.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Behaviors')
@ApiBearerAuth('access-token')
@Controller('behaviors')
@UseGuards(JwtAuthGuard)
export class BehaviorsController {
  constructor(private readonly behaviorsService: BehaviorsService) {}

  @ApiOperation({ summary: 'Crear un comportamiento' })
  @ApiResponse({ status: 201, description: 'Comportamiento creado' })
  @Post()
  async create(@Body() createBehaviorDto: CreateBehaviorDto) {
    const behavior = await this.behaviorsService.create(createBehaviorDto);
    return apiResponse(behavior, 'Behavior created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los comportamientos' })
  @ApiResponse({ status: 200, description: 'Lista de comportamientos' })
  @Get()
  async findAll() {
    const behaviors = await this.behaviorsService.findAll();
    return apiResponse(behaviors, 'Behaviors retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un comportamiento por ID' })
  @ApiResponse({ status: 200, description: 'Comportamiento encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const behavior = await this.behaviorsService.findOne(id);
    return apiResponse(behavior, 'Behavior retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un comportamiento' })
  @ApiResponse({ status: 200, description: 'Comportamiento actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBehaviorDto: UpdateBehaviorDto,
  ) {
    const behavior = await this.behaviorsService.update(id, updateBehaviorDto);
    return apiResponse(behavior, 'Behavior updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un comportamiento (soft delete)' })
  @ApiResponse({ status: 200, description: 'Comportamiento eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.behaviorsService.remove(id);
    return apiResponse(null, message);
  }
}
