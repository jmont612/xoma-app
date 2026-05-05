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
import { BehaviorsService } from './behaviors.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('behaviors')
@UseGuards(JwtAuthGuard)
export class BehaviorsController {
  constructor(private readonly behaviorsService: BehaviorsService) {}

  @Post()
  async create(@Body() createBehaviorDto: CreateBehaviorDto) {
    const behavior = await this.behaviorsService.create(createBehaviorDto);
    return apiResponse(behavior, 'Behavior created successfully');
  }

  @Get()
  async findAll() {
    const behaviors = await this.behaviorsService.findAll();
    return apiResponse(behaviors, 'Behaviors retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const behavior = await this.behaviorsService.findOne(id);
    return apiResponse(behavior, 'Behavior retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBehaviorDto: UpdateBehaviorDto,
  ) {
    const behavior = await this.behaviorsService.update(id, updateBehaviorDto);
    return apiResponse(behavior, 'Behavior updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.behaviorsService.remove(id);
    return apiResponse(null, message);
  }
}
