import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Reflection } from './entities/reflection.entity';
import { CreateReflectionDto } from './dto/create-reflection.dto';
import { UpdateReflectionDto } from './dto/update-reflection.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';
import { Diary } from '@/diaries/entities/diary.entity';

@Injectable()
export class ReflectionsService {
  constructor(
    @InjectRepository(Reflection)
    private readonly reflectionRepository: Repository<Reflection>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createReflectionDto: CreateReflectionDto,
    manager?: EntityManager,
  ): Promise<Reflection> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { diaryId } = createReflectionDto;

        const diary = await manager.findOneBy(Diary, { id: diaryId });
        if (!diary) {
          throw new NotFoundException('Diary not found');
        }

        const reflection = manager.create(Reflection, {
          ...createReflectionDto,
          diary,
        });
        return await manager.save(reflection);
      },
      manager,
    );
  }

  async findAll(): Promise<Reflection[]> {
    return await this.reflectionRepository.find({
      relations: ['diary'],
    });
  }

  async findByDiaryId(diaryId: number): Promise<Reflection[]> {
    return await this.reflectionRepository.find({
      where: { diary: { id: diaryId } },
      relations: ['diary'],
    });
  }

  async findOne(id: number): Promise<Reflection> {
    const reflection = await this.reflectionRepository.findOne({
      where: { id },
      relations: ['diary'],
    });

    if (!reflection) {
      throw new NotFoundException('Reflection not found');
    }

    return reflection;
  }

  async update(
    id: number,
    updateReflectionDto: UpdateReflectionDto,
    manager?: EntityManager,
  ): Promise<Reflection> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const reflection = await this.findOne(id);
        Object.assign(reflection, updateReflectionDto);
        return await manager.save(reflection);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(Reflection, id);
        return 'Reflection deleted successfully';
      },
      manager,
    );
  }
}
