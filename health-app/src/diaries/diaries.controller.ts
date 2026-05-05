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
import { DiariesService } from './diaries.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('diaries')
@UseGuards(JwtAuthGuard)
export class DiariesController {
  constructor(private readonly diariesService: DiariesService) {}

  @Post()
  async create(@Body() createDiaryDto: CreateDiaryDto) {
    const diary = await this.diariesService.create(createDiaryDto);
    return apiResponse(diary, 'Diary entry created successfully');
  }

  @Get()
  async findAll() {
    const diaries = await this.diariesService.findAll();
    return apiResponse(diaries, 'Diary entries retrieved successfully');
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const diaries = await this.diariesService.findByUserId(userId);
    return apiResponse(diaries, 'User diary entries retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const diary = await this.diariesService.findOne(id);
    return apiResponse(diary, 'Diary entry retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    const diary = await this.diariesService.update(id, updateDiaryDto);
    return apiResponse(diary, 'Diary entry updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.diariesService.remove(id);
    return apiResponse(null, message);
  }
}
