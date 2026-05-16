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
import { EmaLogsService } from './ema-logs.service';
import { UpdateEmaLogDto } from './dto/update-ema-log.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';
import { CreateEmaLogsArrayDto } from './dto/create-ema-logs-array.dto';

@Controller('ema-logs')
@UseGuards(JwtAuthGuard)
export class EmaLogsController {
  constructor(private readonly emaLogsService: EmaLogsService) {}

  @Post()
  async create(@Body() createEmaLogsDto: CreateEmaLogsArrayDto) {
    const result = await this.emaLogsService.create(createEmaLogsDto);
    return apiResponse(
      result,
      'EMA logs created successfully with ML prediction',
    );
  }

  @Get()
  async findAll() {
    const emaLogs = await this.emaLogsService.findAll();
    return apiResponse(emaLogs, 'EMA logs retrieved successfully');
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const emaLogs = await this.emaLogsService.findByUserId(userId);
    return apiResponse(emaLogs, 'User EMA logs retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const emaLog = await this.emaLogsService.findOne(id);
    return apiResponse(emaLog, 'EMA log retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmaLogDto: UpdateEmaLogDto,
  ) {
    const emaLog = await this.emaLogsService.update(id, updateEmaLogDto);
    return apiResponse(emaLog, 'EMA log updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emaLogsService.remove(id);
    return apiResponse(null, message);
  }
}
