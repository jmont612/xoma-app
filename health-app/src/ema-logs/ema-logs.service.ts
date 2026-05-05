import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { EmaLog } from './entities/ema-log.entity';
import { UpdateEmaLogDto } from './dto/update-ema-log.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { MlPredictionService } from 'src/ml-prediction/ml-prediction.service';
import { MlPredictionDto } from 'src/ml-prediction/dto/ml-prediction.dto';
import { SubSkill } from 'src/sub-skills/entities/sub-skill.entity';
import { UserSkillActivity } from 'src/user-skill-activities/entities/user-skill-activity.entity';
import { EmergencyContact } from 'src/emergency-contacts/entities/emergency-contact.entity';
import { UsersService } from 'src/users/users.service';
import { EmaTypesService } from 'src/ema-types/ema-types.service';
import { CreateEmaLogsArrayDto } from './dto/create-ema-logs-array.dto';
import { EmaTypeEvaluationType } from 'src/common/enums/ema-type-evaluation-type.enum';

@Injectable()
export class EmaLogsService {
  constructor(
    @InjectRepository(EmaLog)
    private readonly emaLogRepository: Repository<EmaLog>,
    @InjectRepository(SubSkill)
    private readonly subSkillRepository: Repository<SubSkill>,
    @InjectRepository(UserSkillActivity)
    private readonly userSkillActivityRepository: Repository<UserSkillActivity>,
    @InjectRepository(EmergencyContact)
    private readonly emergencyContactRepository: Repository<EmergencyContact>,
    private readonly dataSource: DataSource,
    private readonly mlPredictionService: MlPredictionService,
    private readonly usersService: UsersService,
    private readonly emaTypeService: EmaTypesService,
  ) {}

  async create(
    createEmaLogDtos: CreateEmaLogsArrayDto,
    manager?: EntityManager,
  ): Promise<{
    recommendedSubSkills: SubSkill[];
    emergencyContacts?: EmergencyContact[];
  }> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { userId, emaLogs: newEmaLogs } = createEmaLogDtos;
        const emaLogs: EmaLog[] = [];
        const user = await this.usersService.findOne(userId);

        for (const dto of newEmaLogs) {
          const emaType = await this.emaTypeService.findOne(dto.emaTypeId);

          if (
            emaType.evaluationType === EmaTypeEvaluationType.BOOLEAN &&
            typeof dto.booleanValue !== 'boolean'
          ) {
            throw new BadRequestException(
              `Ema type ${emaType.name} must have a boolean value`,
            );
          }

          const emaLog = manager.create(EmaLog, {
            user,
            emaType,
            ...dto,
          });
          emaLogs.push(emaLog);
        }
        await manager.save(EmaLog, emaLogs);

        const mlPrediction = await this.getMlPrediction(emaLogs);
        const recommendation = await this.getRecommendedSubSkill(
          mlPrediction.label_gate,
          user.id,
        );

        return {
          mlPrediction,
          ...recommendation,
        };
      },
      manager,
    );
  }

  private async getMlPrediction(emaLogs: EmaLog[]) {
    const mlData: MlPredictionDto = {};

    const emaTypesMap = new Map();
    for (const log of emaLogs) {
      emaTypesMap.set(log.emaType.name.toLowerCase(), log);
    }

    mlData.mood_0_10 = emaTypesMap.get('mood')?.rating || 0;
    mlData.stress_0_10 = emaTypesMap.get('stress')?.rating || 0;
    mlData.anxiety_0_10 = emaTypesMap.get('anxiety')?.rating || 0;
    mlData.impulsivity_0_10 = emaTypesMap.get('impulsivity')?.rating || 0;
    mlData.urge_self_harm = emaTypesMap.get('urgeselfharm')?.booleanValue
      ? 1
      : 0;
    mlData.suicidal_ideation = emaTypesMap.get('suicidalideation')?.booleanValue
      ? 1
      : 0;

    return await this.mlPredictionService.getPrediction(mlData);
  }

  private async getRecommendedSubSkill(
    labelGate: string,
    userId: number,
  ): Promise<{
    recommendedSubSkills: SubSkill[];
    emergencyContacts?: EmergencyContact[];
  }> {
    if (labelGate === 'BAJO') {
      return { recommendedSubSkills: [] };
    }

    if (labelGate === 'MEDIO') {
      const subSkills = await this.subSkillRepository
        .createQueryBuilder('subSkill')
        .leftJoinAndSelect('subSkill.steps', 'steps')
        .orderBy('RANDOM()')
        .limit(2)
        .getMany();

      return { recommendedSubSkills: subSkills };
    }

    if (labelGate === 'ALTO') {
      const effectiveSubSkill = await this.userSkillActivityRepository
        .createQueryBuilder('usa')
        .innerJoinAndSelect('usa.subSkill', 'subSkill')
        .innerJoin('usa.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('usa.effective = true')
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();

      let subSkill: SubSkill | null = null;
      if (effectiveSubSkill) {
        subSkill = await this.subSkillRepository
          .createQueryBuilder('subSkill')
          .leftJoinAndSelect('subSkill.steps', 'steps')
          .where('subSkill.id = :id', { id: effectiveSubSkill.subSkill.id })
          .getOne();
      }

      if (!subSkill) {
        subSkill = await this.subSkillRepository
          .createQueryBuilder('subSkill')
          .leftJoinAndSelect('subSkill.steps', 'steps')
          .limit(1)
          .getOne();
      }

      const emergencyContacts = await this.emergencyContactRepository.find({
        where: { user: { id: userId } },
      });

      return {
        recommendedSubSkills: subSkill ? [subSkill] : [],
        emergencyContacts,
      };
    }

    return { recommendedSubSkills: [] };
  }

  async findAll(): Promise<EmaLog[]> {
    return await this.emaLogRepository.find({
      relations: ['user', 'emaType'],
    });
  }

  async findByUserId(userId: number): Promise<EmaLog[]> {
    return await this.emaLogRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'emaType'],
    });
  }

  async findOne(id: number): Promise<EmaLog> {
    const emaLog = await this.emaLogRepository.findOne({
      where: { id },
      relations: ['user', 'emaType'],
    });

    if (!emaLog) {
      throw new NotFoundException('EMA log not found');
    }

    return emaLog;
  }

  async update(
    id: number,
    updateEmaLogDto: UpdateEmaLogDto,
    manager?: EntityManager,
  ): Promise<EmaLog> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const emaLog = await this.findOne(id);
        Object.assign(emaLog, updateEmaLogDto);
        return await manager.save(emaLog);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(EmaLog, id);
        return 'EMA log deleted successfully';
      },
      manager,
    );
  }
}
