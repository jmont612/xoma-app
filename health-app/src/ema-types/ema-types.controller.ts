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
import { EmaTypesService } from './ema-types.service';
import { CreateEmaTypeDto } from './dto/create-ema-type.dto';
import { UpdateEmaTypeDto } from './dto/update-ema-type.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('EMA Types')
@ApiBearerAuth('access-token')
@Controller('ema-types')
@UseGuards(JwtAuthGuard)
export class EmaTypesController {
  constructor(private readonly emaTypesService: EmaTypesService) {}

  @ApiOperation({ summary: 'Crear un tipo de EMA' })
  @ApiResponse({ status: 201, description: 'Tipo EMA creado' })
  @Post()
  async create(@Body() createEmaTypeDto: CreateEmaTypeDto) {
    const emaType = await this.emaTypesService.create(createEmaTypeDto);
    return apiResponse(emaType, 'EMA type created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los tipos de EMA' })
  @ApiResponse({ status: 200, description: 'Lista de tipos EMA' })
  @Get()
  async findAll() {
    const emaTypes = await this.emaTypesService.findAll();
    return apiResponse(emaTypes, 'EMA types retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un tipo de EMA por ID' })
  @ApiResponse({ status: 200, description: 'Tipo EMA encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const emaType = await this.emaTypesService.findOne(id);
    return apiResponse(emaType, 'EMA type retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un tipo de EMA' })
  @ApiResponse({ status: 200, description: 'Tipo EMA actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmaTypeDto: UpdateEmaTypeDto,
  ) {
    const emaType = await this.emaTypesService.update(id, updateEmaTypeDto);
    return apiResponse(emaType, 'EMA type updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un tipo de EMA (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tipo EMA eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emaTypesService.remove(id);
    return apiResponse(null, message);
  }
}
