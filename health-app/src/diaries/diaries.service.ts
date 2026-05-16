import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Diary } from './entities/diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';
import { DiaryMoodStatesService } from '@/diary-mood-states/diary-mood-states.service';
import { DiaryBehaviorsService } from '@/diary-behaviors/diary-behaviors.service';
import { UserSkillActivitiesService } from '@/user-skill-activities/user-skill-activities.service';
import { ReflectionsService } from '@/reflections/reflections.service';
import { UsersService } from '@/users/users.service';

@Injectable()
export class DiariesService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    private readonly dataSource: DataSource,
    private readonly diaryMoodStatesService: DiaryMoodStatesService,
    private readonly diaryBehaviorsService: DiaryBehaviorsService,
    private readonly userSkillActivitiesService: UserSkillActivitiesService,
    private readonly reflectionsService: ReflectionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createDiaryDto: CreateDiaryDto,
    manager?: EntityManager,
  ): Promise<Diary> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const {
          moodStates,
          behaviors,
          userSkillActivities: skillActivities,
          userId,
          reflections,
        } = createDiaryDto;

        const user = await this.usersService.findOne(userId);

        const diary = manager.create(Diary, { user });
        const savedDiary = await manager.save(diary);

        if (moodStates?.length) {
          for (const moodState of moodStates) {
            await this.diaryMoodStatesService.create(
              { ...moodState, diaryId: savedDiary.id },
              manager,
            );
          }
        }

        if (behaviors?.length) {
          for (const behavior of behaviors) {
            await this.diaryBehaviorsService.create(
              { ...behavior, diaryId: savedDiary.id },
              manager,
            );
          }
        }

        if (skillActivities?.length) {
          for (const skillActivity of skillActivities) {
            await this.userSkillActivitiesService.create(
              { ...skillActivity, userId },
              manager,
            );
          }
        }

        if (reflections) {
          await this.reflectionsService.create(
            { ...reflections, diaryId: savedDiary.id },
            manager,
          );
        }

        return savedDiary;
      },
      manager,
    );
  }

  async findAll() {
    const diaries = await this.diaryRepository.find({
      relations: {
        behaviors: {
          behavior: true,
        },
        moodStates: {
          moodState: true,
        },
        reflections: true,
        user: true,
      },
      select: {
        user: {
          id: true,
        },
      },
    });

    const diariesWithSkillActivities = await Promise.all(
      diaries.map(async (diary) => {
        const skillActivities =
          await this.userSkillActivitiesService.findByUserIdAndDate(
            diary.user.id,
            diary.entryDate,
          );

        return { ...diary, skillActivities };
      }),
    );

    return diariesWithSkillActivities;
  }

  async findByUserId(userId: number) {
    const diaries = await this.diaryRepository.find({
      where: {
        user: { id: userId },
      },
      relations: {
        behaviors: {
          behavior: true,
        },
        moodStates: {
          moodState: true,
        },
        reflections: true,
        user: true,
      },
    });

    if (!diaries) {
      throw new NotFoundException(`Diary not found`);
    }

    const diariesWithSkillActivities = await Promise.all(
      diaries.map(async (diary) => {
        const skillActivities =
          await this.userSkillActivitiesService.findByUserIdAndDate(
            userId,
            diary.entryDate,
          );
        return { ...diary, skillActivities };
      }),
    );

    return diariesWithSkillActivities;
  }

  async findOne(id: number) {
    const diary = await this.diaryRepository.findOne({
      where: { id },
      relations: {
        behaviors: {
          behavior: true,
        },
        moodStates: {
          moodState: true,
        },
        reflections: true,
        user: true,
      },
    });

    if (!diary) {
      throw new NotFoundException(`Diary with ID ${id} not found`);
    }

    const skillActivities =
      await this.userSkillActivitiesService.findByUserIdAndDate(
        diary.user.id,
        diary.entryDate,
      );

    return { ...diary, skillActivities };
  }

  async update(
    id: number,
    updateDiaryDto: UpdateDiaryDto,
    manager?: EntityManager,
  ) {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const diary = await this.findOne(id);
        Object.assign(diary, updateDiaryDto);
        return await manager.save(diary);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(Diary, id);
        return 'Diary entry deleted successfully';
      },
      manager,
    );
  }
}
