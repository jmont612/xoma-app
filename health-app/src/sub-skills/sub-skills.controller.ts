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
import { SubSkillsService } from './sub-skills.service';
import { CreateSubSkillDto } from './dto/create-sub-skill.dto';
import { UpdateSubSkillDto } from './dto/update-sub-skill.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { apiResponse } from 'src/common/helpers/response.helper';

@Controller('sub-skills')
@UseGuards(JwtAuthGuard)
export class SubSkillsController {
  constructor(private readonly subSkillsService: SubSkillsService) {}

  @Post()
  async create(@Body() createSubSkillDto: CreateSubSkillDto) {
    const subSkill = await this.subSkillsService.create(createSubSkillDto);
    return apiResponse(subSkill, 'Sub-skill created successfully');
  }

  @Get()
  async findAll() {
    const subSkills = await this.subSkillsService.findAll();
    return apiResponse(subSkills, 'Sub-skills retrieved successfully');
  }

  @Get('skill/:skillId')
  async findBySkillId(@Param('skillId', ParseIntPipe) skillId: number) {
    const subSkills = await this.subSkillsService.findBySkillId(skillId);
    return apiResponse(subSkills, 'Skill sub-skills retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const subSkill = await this.subSkillsService.findOne(id);
    return apiResponse(subSkill, 'Sub-skill retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubSkillDto: UpdateSubSkillDto,
  ) {
    const subSkill = await this.subSkillsService.update(id, updateSubSkillDto);
    return apiResponse(subSkill, 'Sub-skill updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.subSkillsService.remove(id);
    return apiResponse(null, message);
  }
}
