import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Between } from 'typeorm';
import { Diary } from './entities/diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';
import { DiaryMoodStatesService } from '@/diary-mood-states/diary-mood-states.service';
import { DiaryBehaviorsService } from '@/diary-behaviors/diary-behaviors.service';
import { UserSkillActivitiesService } from '@/user-skill-activities/user-skill-activities.service';
import { ReflectionsService } from '@/reflections/reflections.service';
import { UsersService } from '@/users/users.service';
import { DiaryMoodState } from '@/diary-mood-states/entities/diary-mood-state.entity';
import { DiaryBehavior } from '@/diary-behaviors/entities/diary-behavior.entity';
import { Reflection } from '@/reflections/entities/reflection.entity';

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
          entryDate,
        } = createDiaryDto;

        const user = await this.usersService.findOne(userId);

        // Resolver fecha objetivo. Para días pasados se usa el mediodía local
        // y así evitar desfaces de zona horaria al filtrar por rango de día.
        let targetDate: Date;
        if (entryDate) {
          const [y, m, d] = entryDate
            .split('T')[0]
            .split('-')
            .map((n) => Number(n));
          targetDate = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
        } else {
          targetDate = new Date();
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Solo se permite un diario por día por usuario.
        const existingDiary = await manager.findOne(Diary, {
          where: {
            user: { id: userId },
            entryDate: Between(startOfDay, endOfDay),
          },
        });
        if (existingDiary) {
          throw new ConflictException(
            'Ya existe un diario registrado para este día',
          );
        }

        const diary = manager.create(
          Diary,
          entryDate ? { user, entryDate: targetDate } : { user },
        );
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
      throw new NotFoundException(`Diary not found`);
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
        const diary = await this.diaryRepository.findOne({ where: { id } });
        if (!diary) {
          throw new NotFoundException(`Diary not found`);
        }

        if (updateDiaryDto.moodStates?.length) {
          for (const ms of updateDiaryDto.moodStates) {
            await manager.upsert(
              DiaryMoodState,
              {
                diaryId: id,
                moodStateId: ms.moodStateId,
                rating: ms.rating,
                deletedAt: null,
              },
              { conflictPaths: ['diaryId', 'moodStateId'] },
            );
          }
        }

        if (updateDiaryDto.behaviors?.length) {
          for (const b of updateDiaryDto.behaviors) {
            await manager.upsert(
              DiaryBehavior,
              {
                diaryId: id,
                behaviorId: b.behaviorId,
                hasHappened: b.hasHappened,
                deletedAt: null,
              },
              { conflictPaths: ['diaryId', 'behaviorId'] },
            );
          }
        }

        if (updateDiaryDto.reflections) {
          const existingReflection = await manager.findOne(Reflection, {
            where: { diary: { id } },
            withDeleted: true,
          });
          if (existingReflection) {
            Object.assign(existingReflection, updateDiaryDto.reflections, {
              deletedAt: null,
            });
            await manager.save(existingReflection);
          } else {
            const newReflection = manager.create(Reflection, {
              ...updateDiaryDto.reflections,
              diary,
            });
            await manager.save(newReflection);
          }
        }

        return diary;
      },
      manager,
    );
  }

  async getWeeklyStreak(userId: number): Promise<{
    weekStreak: number;
    consecutiveStreak: number;
    daysWithEntries: { day: string; date: string; hasEntry: boolean }[];
  }> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const diaries = await this.diaryRepository.find({
      where: { user: { id: userId }, entryDate: Between(monday, sunday) },
      select: ['entryDate'],
    });

    const daysSet = new Set<string>(
      diaries.map((d) => d.entryDate.toISOString().split('T')[0]),
    );

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      return {
        day: dayNames[i],
        date: dateStr,
        hasEntry: daysSet.has(dateStr),
      };
    });

    const weekStreak = weekDays.filter((d) => d.hasEntry).length;

    let consecutiveStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (daysSet.has(dateStr)) {
        consecutiveStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { weekStreak, consecutiveStreak, daysWithEntries: weekDays };
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
