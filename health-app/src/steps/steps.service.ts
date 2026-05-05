import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Step } from './entities/step.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { SubSkillsService } from 'src/sub-skills/sub-skills.service';

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    private readonly subSkillsService: SubSkillsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createStepDto: CreateStepDto,
    manager?: EntityManager,
  ): Promise<Step> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const subSkill = await this.subSkillsService.findOne(
          createStepDto.subSkillId,
        );

        const step = manager.create(Step, createStepDto);
        step.subSkill = subSkill;
        return await manager.save(step);
      },
      manager,
    );
  }

  async findAll(): Promise<Step[]> {
    return await this.stepRepository.find({
      relations: ['subSkill'],
    });
  }

  async findBySubSkillId(subSkillId: number): Promise<Step[]> {
    return await this.stepRepository.find({
      where: { subSkill: { id: subSkillId } },
      relations: ['subSkill'],
    });
  }

  async findOne(id: number): Promise<Step> {
    const step = await this.stepRepository.findOne({
      where: { id },
      relations: ['subSkill'],
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return step;
  }

  async update(
    id: number,
    updateStepDto: UpdateStepDto,
    manager?: EntityManager,
  ): Promise<Step> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const step = await this.findOne(id);
        Object.assign(step, updateStepDto);
        return await manager.save(step);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(Step, id);
        return 'Step deleted successfully';
      },
      manager,
    );
  }
}
