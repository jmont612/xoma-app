import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createSkillDto: CreateSkillDto,
    manager?: EntityManager,
  ): Promise<Skill> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const existingSkill = await this.skillRepository.findOne({
          where: { name: createSkillDto.name },
        });

        if (existingSkill) {
          throw new ConflictException('Skill already exists');
        }

        const skill = manager.create(Skill, createSkillDto);
        return await manager.save(skill);
      },
      manager,
    );
  }

  async findAll(): Promise<Skill[]> {
    return await this.skillRepository.find({
      relations: ['subSkills'],
    });
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id },
      relations: ['subSkills'],
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async update(
    id: number,
    updateSkillDto: UpdateSkillDto,
    manager?: EntityManager,
  ): Promise<Skill> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const skill = await this.findOne(id);
        Object.assign(skill, updateSkillDto);
        return await manager.save(skill);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(Skill, id);
        return 'Skill deleted successfully';
      },
      manager,
    );
  }
}
