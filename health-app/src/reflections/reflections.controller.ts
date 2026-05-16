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
import { ReflectionsService } from './reflections.service';
import { CreateReflectionDto } from './dto/create-reflection.dto';
import { UpdateReflectionDto } from './dto/update-reflection.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('reflections')
@UseGuards(JwtAuthGuard)
export class ReflectionsController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Post()
  async create(@Body() createReflectionDto: CreateReflectionDto) {
    const reflection =
      await this.reflectionsService.create(createReflectionDto);
    return apiResponse(reflection, 'Reflection created successfully');
  }

  @Get()
  async findAll() {
    const reflections = await this.reflectionsService.findAll();
    return apiResponse(reflections, 'Reflections retrieved successfully');
  }

  @Get('diary/:diaryId')
  async findByDiaryId(@Param('diaryId', ParseIntPipe) diaryId: number) {
    const reflections = await this.reflectionsService.findByDiaryId(diaryId);
    return apiResponse(reflections, 'Diary reflections retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reflection = await this.reflectionsService.findOne(id);
    return apiResponse(reflection, 'Reflection retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReflectionDto: UpdateReflectionDto,
  ) {
    const reflection = await this.reflectionsService.update(
      id,
      updateReflectionDto,
    );
    return apiResponse(reflection, 'Reflection updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.reflectionsService.remove(id);
    return apiResponse(null, message);
  }
}
