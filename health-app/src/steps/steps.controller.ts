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
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('steps')
@UseGuards(JwtAuthGuard)
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post()
  async create(@Body() createStepDto: CreateStepDto) {
    const step = await this.stepsService.create(createStepDto);
    return apiResponse(step, 'Step created successfully');
  }

  @Get()
  async findAll() {
    const steps = await this.stepsService.findAll();
    return apiResponse(steps, 'Steps retrieved successfully');
  }

  @Get('sub-skill/:subSkillId')
  async findBySubSkillId(
    @Param('subSkillId', ParseIntPipe) subSkillId: number,
  ) {
    const steps = await this.stepsService.findBySubSkillId(subSkillId);
    return apiResponse(steps, 'Sub-skill steps retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const step = await this.stepsService.findOne(id);
    return apiResponse(step, 'Step retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStepDto: UpdateStepDto,
  ) {
    const step = await this.stepsService.update(id, updateStepDto);
    return apiResponse(step, 'Step updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.stepsService.remove(id);
    return apiResponse(null, message);
  }
}
