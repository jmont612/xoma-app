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
import { DailyQuotesService } from './daily-quotes.service';
import { CreateDailyQuoteDto } from './dto/create-daily-quote.dto';
import { UpdateDailyQuoteDto } from './dto/update-daily-quote.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@ApiTags('Daily Quotes')
@ApiBearerAuth('access-token')
@Controller('daily-quotes')
@UseGuards(JwtAuthGuard)
export class DailyQuotesController {
  constructor(private readonly dailyQuotesService: DailyQuotesService) {}

  @ApiOperation({ summary: 'Crear una cita del día' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @Post()
  async create(@Body() createDailyQuoteDto: CreateDailyQuoteDto) {
    const dailyQuote =
      await this.dailyQuotesService.create(createDailyQuoteDto);
    return apiResponse(dailyQuote, 'Daily quote created successfully');
  }

  @ApiOperation({ summary: 'Obtener todas las citas del día' })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  @Get()
  async findAll() {
    const dailyQuotes = await this.dailyQuotesService.findAll();
    return apiResponse(dailyQuotes, 'Daily quotes retrieved successfully');
  }

  @ApiOperation({
    summary: 'Obtener la cita correspondiente a un día del año (1–365)',
  })
  @ApiResponse({ status: 200, description: 'Cita del día encontrada' })
  @ApiResponse({ status: 404, description: 'No existe cita para ese día' })
  @Get('day/:day')
  async findByDay(@Param('day', ParseIntPipe) day: number) {
    const dailyQuote = await this.dailyQuotesService.findByDay(day);
    return apiResponse(dailyQuote, 'Daily quote retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener una cita por ID' })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const dailyQuote = await this.dailyQuotesService.findOne(id);
    return apiResponse(dailyQuote, 'Daily quote retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar una cita del día' })
  @ApiResponse({ status: 200, description: 'Cita actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDailyQuoteDto: UpdateDailyQuoteDto,
  ) {
    const dailyQuote = await this.dailyQuotesService.update(
      id,
      updateDailyQuoteDto,
    );
    return apiResponse(dailyQuote, 'Daily quote updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar una cita del día (soft delete)' })
  @ApiResponse({ status: 200, description: 'Cita eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.dailyQuotesService.remove(id);
    return apiResponse(null, message);
  }
}
