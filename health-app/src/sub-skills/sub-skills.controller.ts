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
import { SubSkillsService } from './sub-skills.service';
import { CreateSubSkillDto } from './dto/create-sub-skill.dto';
import { UpdateSubSkillDto } from './dto/update-sub-skill.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Sub-Skills')
@ApiBearerAuth('access-token')
@Controller('sub-skills')
@UseGuards(JwtAuthGuard)
export class SubSkillsController {
  constructor(private readonly subSkillsService: SubSkillsService) {}

  @ApiOperation({ summary: 'Crear una sub-habilidad' })
  @ApiResponse({ status: 201, description: 'Sub-habilidad creada' })
  @Post()
  async create(@Body() createSubSkillDto: CreateSubSkillDto) {
    const subSkill = await this.subSkillsService.create(createSubSkillDto);
    return apiResponse(subSkill, 'Sub-skill created successfully');
  }

  @ApiOperation({ summary: 'Obtener todas las sub-habilidades' })
  @ApiResponse({ status: 200, description: 'Lista de sub-habilidades' })
  @Get()
  async findAll() {
    const subSkills = await this.subSkillsService.findAll();
    return apiResponse(subSkills, 'Sub-skills retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener sub-habilidades de una habilidad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sub-habilidades de la habilidad',
  })
  @Get('skill/:skillId')
  async findBySkillId(@Param('skillId', ParseIntPipe) skillId: number) {
    const subSkills = await this.subSkillsService.findBySkillId(skillId);
    return apiResponse(subSkills, 'Skill sub-skills retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener una sub-habilidad por ID' })
  @ApiResponse({ status: 200, description: 'Sub-habilidad encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const subSkill = await this.subSkillsService.findOne(id);
    return apiResponse(subSkill, 'Sub-skill retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar una sub-habilidad' })
  @ApiResponse({ status: 200, description: 'Sub-habilidad actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubSkillDto: UpdateSubSkillDto,
  ) {
    const subSkill = await this.subSkillsService.update(id, updateSubSkillDto);
    return apiResponse(subSkill, 'Sub-skill updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar una sub-habilidad (soft delete)' })
  @ApiResponse({ status: 200, description: 'Sub-habilidad eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.subSkillsService.remove(id);
    return apiResponse(null, message);
  }
}
