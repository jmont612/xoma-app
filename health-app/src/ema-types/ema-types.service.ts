import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { EmaType } from './entities/ema-type.entity';
import { CreateEmaTypeDto } from './dto/create-ema-type.dto';
import { UpdateEmaTypeDto } from './dto/update-ema-type.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';

@Injectable()
export class EmaTypesService {
  constructor(
    @InjectRepository(EmaType)
    private readonly emaTypeRepository: Repository<EmaType>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createEmaTypeDto: CreateEmaTypeDto,
    manager?: EntityManager,
  ): Promise<EmaType> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const existingEmaType = await this.emaTypeRepository.findOne({
          where: { name: createEmaTypeDto.name },
        });

        if (existingEmaType) {
          throw new ConflictException('EMA type already exists');
        }

        const emaType = manager.create(EmaType, createEmaTypeDto);
        return await manager.save(emaType);
      },
      manager,
    );
  }

  async findAll(): Promise<EmaType[]> {
    return await this.emaTypeRepository.find();
  }

  async findOne(id: number): Promise<EmaType> {
    const emaType = await this.emaTypeRepository.findOne({
      where: { id },
    });

    if (!emaType) {
      throw new NotFoundException('EMA type not found');
    }

    return emaType;
  }

  async update(
    id: number,
    updateEmaTypeDto: UpdateEmaTypeDto,
    manager?: EntityManager,
  ): Promise<EmaType> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const emaType = await this.findOne(id);
        Object.assign(emaType, updateEmaTypeDto);
        return await manager.save(emaType);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(EmaType, id);
        return 'EMA type deleted successfully';
      },
      manager,
    );
  }
}
