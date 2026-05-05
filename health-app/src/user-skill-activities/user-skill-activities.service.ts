import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Between } from 'typeorm';
import { UserSkillActivity } from './entities/user-skill-activity.entity';
import { CreateUserSkillActivityDto } from './dto/create-user-skill-activity.dto';
import { UpdateSkillActivityDto } from './dto/update-user-skill-activity.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { User } from 'src/users/entities/user.entity';
import { SubSkill } from 'src/sub-skills/entities/sub-skill.entity';

@Injectable()
export class UserSkillActivitiesService {
  constructor(
    @InjectRepository(UserSkillActivity)
    private readonly userSkillActivityRepository: Repository<UserSkillActivity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createSkillActivityDto: CreateUserSkillActivityDto,
    manager?: EntityManager,
  ): Promise<UserSkillActivity> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { subSkillId, userId } = createSkillActivityDto;

        const user = await manager.findOne(User, {
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const subSkill = await manager.findOne(SubSkill, {
          where: { id: subSkillId },
        });
        if (!subSkill) {
          throw new NotFoundException('SubSkill not found');
        }

        const skillActivity = manager.create(UserSkillActivity, {
          user,
          subSkill,
          ...createSkillActivityDto,
        });
        return await manager.save(skillActivity);
      },
      manager,
    );
  }

  async findByUserIdAndDate(
    userId: number,
    date: Date,
  ): Promise<UserSkillActivity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.userSkillActivityRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['subSkill'],
    });
  }

  async update(
    id: number,
    updateSkillActivityDto: UpdateSkillActivityDto,
    manager?: EntityManager,
  ): Promise<UserSkillActivity> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const skillActivity = await this.userSkillActivityRepository.findOne({
          where: { id },
          relations: {
            user: true,
          },
        });

        if (!skillActivity) {
          throw new NotFoundException('Skill activity not found');
        }

        if (updateSkillActivityDto.userId) {
          const user = await manager.findOne(User, {
            where: { id: updateSkillActivityDto.userId },
          });

          if (!user) {
            throw new NotFoundException('User not found');
          }

          skillActivity.user = user;
        }

        Object.assign(skillActivity, {
          status: updateSkillActivityDto.status,
          effective: updateSkillActivityDto.effective,
          rating: updateSkillActivityDto.rating,
        });
        return await manager.save(skillActivity);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const skillActivity = await this.userSkillActivityRepository.findOne({
          where: { id },
        });

        if (!skillActivity) {
          throw new NotFoundException('Skill activity not found');
        }

        await manager.softDelete(UserSkillActivity, id);
        return 'Skill activity deleted successfully';
      },
      manager,
    );
  }
}
