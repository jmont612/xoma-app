import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { DiaryBehavior } from './entities/diary-behavior.entity';
import { CreateDiaryBehaviorDto } from './dto/create-diary-behavior.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';
import { Diary } from '@/diaries/entities/diary.entity';
import { Behavior } from '@/behaviors/entities/behavior.entity';

@Injectable()
export class DiaryBehaviorsService {
  constructor(
    @InjectRepository(DiaryBehavior)
    private readonly diaryBehaviorRepository: Repository<DiaryBehavior>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDiaryBehaviorDto: CreateDiaryBehaviorDto,
    manager?: EntityManager,
  ): Promise<DiaryBehavior> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { diaryId, behaviorId, hasHappened } = createDiaryBehaviorDto;

        const diary = await manager.findOne(Diary, {
          where: { id: diaryId },
        });
        if (!diary) {
          throw new NotFoundException('Diary not found');
        }

        const behavior = await manager.findOne(Behavior, {
          where: { id: behaviorId },
        });
        if (!behavior) {
          throw new NotFoundException('Behavior not found');
        }

        const diaryBehavior = manager.create(DiaryBehavior, {
          diary,
          behavior,
          hasHappened,
        });

        return await manager.save(diaryBehavior);
      },
      manager,
    );
  }

  async findByDiaryId(diaryId: number): Promise<DiaryBehavior[]> {
    return await this.diaryBehaviorRepository.find({
      where: { diaryId },
      relations: ['diary', 'behavior'],
    });
  }

  async remove(
    diaryId: number,
    behaviorId: number,
    manager?: EntityManager,
  ): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const diaryBehavior = await this.diaryBehaviorRepository.findOne({
          where: { diaryId, behaviorId },
        });

        if (!diaryBehavior) {
          throw new NotFoundException('Diary behavior not found');
        }

        await manager.softDelete(DiaryBehavior, { diaryId, behaviorId });
        return 'Diary behavior deleted successfully';
      },
      manager,
    );
  }
}
