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
  Query,
} from '@nestjs/common';
import { UserSkillActivitiesService } from './user-skill-activities.service';
import { CreateUserSkillActivityDto } from './dto/create-user-skill-activity.dto';
import { UpdateSkillActivityDto } from './dto/update-user-skill-activity.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { apiResponse } from '@/common/helpers/response.helper';

@Controller('user-skill-activities')
@UseGuards(JwtAuthGuard)
export class SkillActivitiesController {
  constructor(
    private readonly skillActivitiesService: UserSkillActivitiesService,
  ) {}

  @Post()
  async create(@Body() createSkillActivityDto: CreateUserSkillActivityDto) {
    const skillActivity = await this.skillActivitiesService.create(
      createSkillActivityDto,
    );
    return apiResponse(skillActivity, 'Skill activity created successfully');
  }

  @Get('user/:userId')
  async findByUserIdAndDate(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date: string,
  ) {
    const skillActivities =
      await this.skillActivitiesService.findByUserIdAndDate(
        userId,
        new Date(date),
      );
    return apiResponse(
      skillActivities,
      'Skill activities retrieved successfully',
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillActivityDto: UpdateSkillActivityDto,
  ) {
    const skillActivity = await this.skillActivitiesService.update(
      id,
      updateSkillActivityDto,
    );
    return apiResponse(skillActivity, 'Skill activity updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.skillActivitiesService.remove(id);
    return apiResponse(null, message);
  }
}
