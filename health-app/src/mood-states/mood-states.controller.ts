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
import { MoodStatesService } from './mood-states.service';
import { CreateMoodStateDto } from './dto/create-mood-state.dto';
import { UpdateMoodStateDto } from './dto/update-mood-state.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('mood-states')
@UseGuards(JwtAuthGuard)
export class MoodStatesController {
  constructor(private readonly moodStatesService: MoodStatesService) {}

  @Post()
  async create(@Body() createMoodStateDto: CreateMoodStateDto) {
    const moodState = await this.moodStatesService.create(createMoodStateDto);
    return apiResponse(moodState, 'Mood state created successfully');
  }

  @Get()
  async findAll() {
    const moodStates = await this.moodStatesService.findAll();
    return apiResponse(moodStates, 'Mood states retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const moodState = await this.moodStatesService.findOne(id);
    return apiResponse(moodState, 'Mood state retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMoodStateDto: UpdateMoodStateDto,
  ) {
    const moodState = await this.moodStatesService.update(
      id,
      updateMoodStateDto,
    );
    return apiResponse(moodState, 'Mood state updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.moodStatesService.remove(id);
    return apiResponse(null, message);
  }
}
