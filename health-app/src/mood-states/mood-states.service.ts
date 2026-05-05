import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { MoodState } from './entities/mood-state.entity';
import { CreateMoodStateDto } from './dto/create-mood-state.dto';
import { UpdateMoodStateDto } from './dto/update-mood-state.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class MoodStatesService {
  constructor(
    @InjectRepository(MoodState)
    private readonly moodStateRepository: Repository<MoodState>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createMoodStateDto: CreateMoodStateDto,
    manager?: EntityManager,
  ): Promise<MoodState> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const existingMoodState = await this.moodStateRepository.findOne({
          where: { name: createMoodStateDto.name },
        });

        if (existingMoodState) {
          throw new ConflictException('Mood state already exists');
        }

        const moodState = manager.create(MoodState, createMoodStateDto);
        return await manager.save(moodState);
      },
      manager,
    );
  }

  async findAll(): Promise<MoodState[]> {
    return await this.moodStateRepository.find();
  }

  async findOne(id: number): Promise<MoodState> {
    const moodState = await this.moodStateRepository.findOne({
      where: { id },
    });

    if (!moodState) {
      throw new NotFoundException('Mood state not found');
    }

    return moodState;
  }

  async update(
    id: number,
    updateMoodStateDto: UpdateMoodStateDto,
    manager?: EntityManager,
  ): Promise<MoodState> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const moodState = await this.findOne(id);
        Object.assign(moodState, updateMoodStateDto);
        return await manager.save(moodState);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(MoodState, id);
        return 'Mood state deleted successfully';
      },
      manager,
    );
  }
}
