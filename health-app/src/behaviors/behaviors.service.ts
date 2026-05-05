import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Behavior } from './entities/behavior.entity';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class BehaviorsService {
  constructor(
    @InjectRepository(Behavior)
    private readonly behaviorRepository: Repository<Behavior>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createBehaviorDto: CreateBehaviorDto,
    manager?: EntityManager,
  ): Promise<Behavior> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const existingBehavior = await this.behaviorRepository.findOne({
          where: { name: createBehaviorDto.name },
        });

        if (existingBehavior) {
          throw new ConflictException('Behavior already exists');
        }

        const behavior = manager.create(Behavior, createBehaviorDto);
        return await manager.save(behavior);
      },
      manager,
    );
  }

  async findAll(): Promise<Behavior[]> {
    return await this.behaviorRepository.find();
  }

  async findOne(id: number): Promise<Behavior> {
    const behavior = await this.behaviorRepository.findOne({
      where: { id },
    });

    if (!behavior) {
      throw new NotFoundException('Behavior not found');
    }

    return behavior;
  }

  async update(
    id: number,
    updateBehaviorDto: UpdateBehaviorDto,
    manager?: EntityManager,
  ): Promise<Behavior> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const behavior = await this.findOne(id);
        Object.assign(behavior, updateBehaviorDto);
        return await manager.save(behavior);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(Behavior, id);
        return 'Behavior deleted successfully';
      },
      manager,
    );
  }
}
