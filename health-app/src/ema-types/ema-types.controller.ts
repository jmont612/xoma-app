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
import { EmaTypesService } from './ema-types.service';
import { CreateEmaTypeDto } from './dto/create-ema-type.dto';
import { UpdateEmaTypeDto } from './dto/update-ema-type.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('ema-types')
@UseGuards(JwtAuthGuard)
export class EmaTypesController {
  constructor(private readonly emaTypesService: EmaTypesService) {}

  @Post()
  async create(@Body() createEmaTypeDto: CreateEmaTypeDto) {
    const emaType = await this.emaTypesService.create(createEmaTypeDto);
    return apiResponse(emaType, 'EMA type created successfully');
  }

  @Get()
  async findAll() {
    const emaTypes = await this.emaTypesService.findAll();
    return apiResponse(emaTypes, 'EMA types retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const emaType = await this.emaTypesService.findOne(id);
    return apiResponse(emaType, 'EMA type retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmaTypeDto: UpdateEmaTypeDto,
  ) {
    const emaType = await this.emaTypesService.update(id, updateEmaTypeDto);
    return apiResponse(emaType, 'EMA type updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emaTypesService.remove(id);
    return apiResponse(null, message);
  }
}
