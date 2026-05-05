import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { DiaryMoodState } from './entities/diary-mood-state.entity';
import { CreateDiaryMoodStateDto } from './dto/create-diary-mood-state.dto';
import { UpdateDiaryMoodStateDto } from './dto/update-diary-mood-state.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { Diary } from 'src/diaries/entities/diary.entity';
import { MoodState } from 'src/mood-states/entities/mood-state.entity';

@Injectable()
export class DiaryMoodStatesService {
  constructor(
    @InjectRepository(DiaryMoodState)
    private readonly diaryMoodStateRepository: Repository<DiaryMoodState>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDiaryMoodStateDto: CreateDiaryMoodStateDto,
    manager?: EntityManager,
  ): Promise<DiaryMoodState> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { diaryId, moodStateId } = createDiaryMoodStateDto;

        const diary = await manager.findOne(Diary, { where: { id: diaryId } });
        if (!diary) {
          throw new NotFoundException('Diary not found');
        }

        const moodState = await manager.findOne(MoodState, {
          where: { id: moodStateId },
        });
        if (!moodState) {
          throw new NotFoundException('Mood state not found');
        }

        const diaryMoodState = manager.create(DiaryMoodState, {
          moodState,
          diary,
          ...createDiaryMoodStateDto,
        });
        return await manager.save(diaryMoodState);
      },
      manager,
    );
  }

  async findByDiaryId(diaryId: number): Promise<DiaryMoodState[]> {
    return await this.diaryMoodStateRepository.find({
      where: { diaryId },
      relations: ['diary', 'moodState'],
    });
  }

  async update(
    diaryId: number,
    moodStateId: number,
    updateDiaryMoodStateDto: UpdateDiaryMoodStateDto,
    manager?: EntityManager,
  ): Promise<DiaryMoodState> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const diaryMoodState = await this.diaryMoodStateRepository.findOne({
          where: { diaryId, moodStateId },
        });

        if (!diaryMoodState) {
          throw new NotFoundException('Diary mood state not found');
        }

        Object.assign(diaryMoodState, updateDiaryMoodStateDto);
        return await manager.save(diaryMoodState);
      },
      manager,
    );
  }

  async remove(
    diaryId: number,
    moodStateId: number,
    manager?: EntityManager,
  ): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const diaryMoodState = await this.diaryMoodStateRepository.findOne({
          where: { diaryId, moodStateId },
        });

        if (!diaryMoodState) {
          throw new NotFoundException('Diary mood state not found');
        }

        await manager.softDelete(DiaryMoodState, { diaryId, moodStateId });
        return 'Diary mood state deleted successfully';
      },
      manager,
    );
  }
}
