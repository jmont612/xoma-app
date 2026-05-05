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
import { DailyQuotesService } from './daily-quotes.service';
import { CreateDailyQuoteDto } from './dto/create-daily-quote.dto';
import { UpdateDailyQuoteDto } from './dto/update-daily-quote.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('daily-quotes')
@UseGuards(JwtAuthGuard)
export class DailyQuotesController {
  constructor(private readonly dailyQuotesService: DailyQuotesService) {}

  @Post()
  async create(@Body() createDailyQuoteDto: CreateDailyQuoteDto) {
    const dailyQuote =
      await this.dailyQuotesService.create(createDailyQuoteDto);
    return apiResponse(dailyQuote, 'Daily quote created successfully');
  }

  @Get()
  async findAll() {
    const dailyQuotes = await this.dailyQuotesService.findAll();
    return apiResponse(dailyQuotes, 'Daily quotes retrieved successfully');
  }

  @Get('day/:day')
  async findByDay(@Param('day', ParseIntPipe) day: number) {
    const dailyQuote = await this.dailyQuotesService.findByDay(day);
    return apiResponse(dailyQuote, 'Daily quote retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const dailyQuote = await this.dailyQuotesService.findOne(id);
    return apiResponse(dailyQuote, 'Daily quote retrieved successfully');
  }

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

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.dailyQuotesService.remove(id);
    return apiResponse(null, message);
  }
}
