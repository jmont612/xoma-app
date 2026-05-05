import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SubSkill } from './entities/sub-skill.entity';
import { CreateSubSkillDto } from './dto/create-sub-skill.dto';
import { UpdateSubSkillDto } from './dto/update-sub-skill.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { SkillsService } from 'src/skills/skills.service';

@Injectable()
export class SubSkillsService {
  constructor(
    @InjectRepository(SubSkill)
    private readonly subSkillRepository: Repository<SubSkill>,
    private readonly skillsService: SkillsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createSubSkillDto: CreateSubSkillDto,
    manager?: EntityManager,
  ): Promise<SubSkill> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const skill = await this.skillsService.findOne(
          createSubSkillDto.skillId,
        );

        const subSkill = manager.create(SubSkill, createSubSkillDto);
        subSkill.skill = skill;
        return await manager.save(subSkill);
      },
      manager,
    );
  }

  async findAll(): Promise<SubSkill[]> {
    return await this.subSkillRepository.find({
      relations: ['skill', 'steps'],
    });
  }

  async findBySkillId(skillId: number): Promise<SubSkill[]> {
    return await this.subSkillRepository.find({
      where: { skill: { id: skillId } },
      relations: ['skill', 'steps'],
    });
  }

  async findOne(id: number): Promise<SubSkill> {
    const subSkill = await this.subSkillRepository.findOne({
      where: { id },
      relations: ['skill', 'steps'],
    });

    if (!subSkill) {
      throw new NotFoundException('Sub-skill not found');
    }

    return subSkill;
  }

  async update(
    id: number,
    updateSubSkillDto: UpdateSubSkillDto,
    manager?: EntityManager,
  ): Promise<SubSkill> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const subSkill = await this.findOne(id);
        Object.assign(subSkill, updateSubSkillDto);
        return await manager.save(subSkill);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(SubSkill, id);
        return 'Sub-skill deleted successfully';
      },
      manager,
    );
  }
}
