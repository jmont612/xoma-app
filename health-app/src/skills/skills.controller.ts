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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  async create(@Body() createSkillDto: CreateSkillDto) {
    const skill = await this.skillsService.create(createSkillDto);
    return apiResponse(skill, 'Skill created successfully');
  }

  @Get()
  async findAll() {
    const skills = await this.skillsService.findAll();
    return apiResponse(skills, 'Skills retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const skill = await this.skillsService.findOne(id);
    return apiResponse(skill, 'Skill retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return apiResponse(skill, 'Skill updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.skillsService.remove(id);
    return apiResponse(null, message);
  }
}
