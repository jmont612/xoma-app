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
} from '@nestjs/swagger';
import { EmaLogsService } from './ema-logs.service';
import { UpdateEmaLogDto } from './dto/update-ema-log.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';
import { CreateEmaLogsArrayDto } from './dto/create-ema-logs-array.dto';
import { SearchFiltersDto } from './dto/search-filters.dto';

@ApiTags('EMA Logs')
@ApiBearerAuth('access-token')
@Controller('ema-logs')
@UseGuards(JwtAuthGuard)
export class EmaLogsController {
  constructor(private readonly emaLogsService: EmaLogsService) {}

  @ApiOperation({
    summary: 'Crear una sesión de logs EMA con predicción de riesgo ML',
  })
  @ApiResponse({
    status: 201,
    description: 'Logs EMA creados y predicción de riesgo calculada',
  })
  @Post()
  async create(@Body() createEmaLogsDto: CreateEmaLogsArrayDto) {
    const result = await this.emaLogsService.create(createEmaLogsDto);
    return apiResponse(
      result,
      'EMA logs created successfully with ML prediction',
    );
  }

  @ApiOperation({ summary: 'Obtener todos los logs EMA' })
  @ApiResponse({ status: 200, description: 'Lista de logs EMA' })
  @Get()
  async findAll() {
    const emaLogs = await this.emaLogsService.findAll();
    return apiResponse(emaLogs, 'EMA logs retrieved successfully');
  }

  @ApiOperation({
    summary:
      'Obtener la última sesión EMA del día de un usuario para la fecha dada, por defecto hoy',
  })
  @ApiResponse({
    status: 200,
    description:
      'Última sesión EMA del día (agrupada por ventana de 30 segundos)',
  })
  @Get('user/:userId/today')
  async findLastEmaToday(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() searchFilters: SearchFiltersDto,
  ) {
    const logs = await this.emaLogsService.findLastEmaByUserAndDate(
      userId,
      searchFilters.date,
    );
    return apiResponse(logs, 'Last EMA of the day retrieved successfully');
  }

  @ApiOperation({
    summary:
      'Obtener resumen diario: última EMA + últimas 4 habilidades de hoy',
  })
  @ApiResponse({
    status: 200,
    description: 'Objeto con lastEma y skillActivities del día',
  })
  @Get('user/:userId/daily-summary')
  async getDailySummary(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() searchFilters: SearchFiltersDto,
  ) {
    const summary = await this.emaLogsService.getDailySummary(
      userId,
      searchFilters.date,
    );
    return apiResponse(summary, 'Daily summary retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los logs EMA de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de logs EMA del usuario' })
  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const emaLogs = await this.emaLogsService.findByUserId(userId);
    return apiResponse(emaLogs, 'User EMA logs retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un log EMA por ID' })
  @ApiResponse({ status: 200, description: 'Log EMA encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const emaLog = await this.emaLogsService.findOne(id);
    return apiResponse(emaLog, 'EMA log retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un log EMA' })
  @ApiResponse({ status: 200, description: 'Log EMA actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmaLogDto: UpdateEmaLogDto,
  ) {
    const emaLog = await this.emaLogsService.update(id, updateEmaLogDto);
    return apiResponse(emaLog, 'EMA log updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un log EMA (soft delete)' })
  @ApiResponse({ status: 200, description: 'Log EMA eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emaLogsService.remove(id);
    return apiResponse(null, message);
  }
}
