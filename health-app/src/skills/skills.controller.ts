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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Skills')
@ApiBearerAuth('access-token')
@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiOperation({ summary: 'Crear una habilidad DBT' })
  @ApiResponse({ status: 201, description: 'Habilidad creada' })
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto) {
    const skill = await this.skillsService.create(createSkillDto);
    return apiResponse(skill, 'Skill created successfully');
  }

  @ApiOperation({ summary: 'Obtener todas las habilidades DBT' })
  @ApiResponse({ status: 200, description: 'Lista de habilidades' })
  @Get()
  async findAll() {
    const skills = await this.skillsService.findAll();
    return apiResponse(skills, 'Skills retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener una habilidad por ID' })
  @ApiResponse({ status: 200, description: 'Habilidad encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const skill = await this.skillsService.findOne(id);
    return apiResponse(skill, 'Skill retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar una habilidad' })
  @ApiResponse({ status: 200, description: 'Habilidad actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return apiResponse(skill, 'Skill updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar una habilidad (soft delete)' })
  @ApiResponse({ status: 200, description: 'Habilidad eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.skillsService.remove(id);
    return apiResponse(null, message);
  }
}
