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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UserSkillActivitiesService } from './user-skill-activities.service';
import { CreateUserSkillActivityDto } from './dto/create-user-skill-activity.dto';
import { UpdateSkillActivityDto } from './dto/update-user-skill-activity.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('User Skill Activities')
@ApiBearerAuth('access-token')
@Controller('user-skill-activities')
@UseGuards(JwtAuthGuard)
export class SkillActivitiesController {
  constructor(
    private readonly skillActivitiesService: UserSkillActivitiesService,
  ) {}

  @ApiOperation({
    summary: 'Registrar una actividad de habilidad para un usuario',
  })
  @ApiResponse({ status: 201, description: 'Actividad de habilidad creada' })
  @Post()
  async create(@Body() createSkillActivityDto: CreateUserSkillActivityDto) {
    const skillActivity = await this.skillActivitiesService.create(
      createSkillActivityDto,
    );
    return apiResponse(skillActivity, 'Skill activity created successfully');
  }

  @ApiOperation({
    summary: 'Obtener las últimas habilidades realizadas hoy por un usuario',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Máximo de resultados (default: 4)',
    example: '4',
  })
  @ApiResponse({
    status: 200,
    description:
      'Últimas N actividades de habilidad del día de hoy, ordenadas por más reciente',
  })
  @Get('user/:userId/today')
  async findLatestToday(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ) {
    const skillActivities =
      await this.skillActivitiesService.findLatestTodayByUserId(
        userId,
        limit ? parseInt(limit, 10) : 4,
      );
    return apiResponse(
      skillActivities,
      "Today's skill activities retrieved successfully",
    );
  }

  @ApiOperation({
    summary:
      'Obtener actividades de habilidad de un usuario filtradas por fecha',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Fecha en formato ISO',
    example: '2025-05-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de actividades del día indicado',
  })
  @Get('user/:userId')
  async findByUserIdAndDate(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date: string,
  ) {
    const skillActivities =
      await this.skillActivitiesService.findByUserIdAndDate(
        userId,
        new Date(date),
      );
    return apiResponse(
      skillActivities,
      'Skill activities retrieved successfully',
    );
  }

  @ApiOperation({ summary: 'Actualizar una actividad de habilidad' })
  @ApiResponse({ status: 200, description: 'Actividad actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillActivityDto: UpdateSkillActivityDto,
  ) {
    const skillActivity = await this.skillActivitiesService.update(
      id,
      updateSkillActivityDto,
    );
    return apiResponse(skillActivity, 'Skill activity updated successfully');
  }

  @ApiOperation({
    summary: 'Eliminar una actividad de habilidad (soft delete)',
  })
  @ApiResponse({ status: 200, description: 'Actividad eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.skillActivitiesService.remove(id);
    return apiResponse(null, message);
  }
}
