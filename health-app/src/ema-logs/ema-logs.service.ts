import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Between, In } from 'typeorm';
import { EmaLog } from './entities/ema-log.entity';
import { UpdateEmaLogDto } from './dto/update-ema-log.dto';
import { withTransaction } from '@/common/helpers/transaction.helper';
import { MlPredictionService } from '@/ml-prediction/ml-prediction.service';
import { MlPredictionDto } from '@/ml-prediction/dto/ml-prediction.dto';
import { SubSkill } from '@/sub-skills/entities/sub-skill.entity';
import { UserSkillActivity } from '@/user-skill-activities/entities/user-skill-activity.entity';
import { EmergencyContact } from '@/emergency-contacts/entities/emergency-contact.entity';
import { UsersService } from '@/users/users.service';
import { EmaTypesService } from '@/ema-types/ema-types.service';
import { CreateEmaLogsArrayDto } from './dto/create-ema-logs-array.dto';
import { EmaTypeEvaluationType } from '@/common/enums/ema-type-evaluation-type.enum';

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
        const savedEmaLogs = await manager.save(EmaLog, emaLogs);

        const mlPrediction = await this.getMlPrediction(emaLogs);
        const riskLevel = mlPrediction.label_gate;

        if (savedEmaLogs.length > 0) {
          await manager.update(
            EmaLog,
            { id: In(savedEmaLogs.map((l) => l.id)) },
            { riskLevel },
          );
        }
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

  async findLastEmaByUserAndDate(
    userId: number,
    date?: string,
  ): Promise<EmaLog[]> {
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      startOfDay = new Date(date);
      // ISO datetime (local midnight sent as UTC) → ventana de 24h exacta
      // YYYY-MM-DD (sin hora) → se parsea como UTC midnight, ventana UTC completa
      if (date.includes('T')) {
        endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      } else {
        endOfDay = new Date(startOfDay);
        endOfDay.setUTCHours(23, 59, 59, 999);
      }
    } else {
      startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
    }

    const allLogsToday = await this.emaLogRepository.find({
      where: {
        user: { id: userId },
        logDate: Between(startOfDay, endOfDay),
      },
      relations: ['emaType'],
      order: { logDate: 'DESC' },
    });

    if (allLogsToday.length === 0) return [];

    // Agrupa los logs de la sesión más reciente (margen de 30 segundos)
    const latestLogDate = allLogsToday[0].logDate;
    return allLogsToday.filter(
      (log) => latestLogDate.getTime() - log.logDate.getTime() <= 30000,
    );
  }

  async getDailySummary(
    userId: number,
    date?: string,
  ): Promise<{ lastEma: EmaLog[]; skillActivities: UserSkillActivity[] }> {
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      startOfDay = new Date(date);
      if (date.includes('T')) {
        endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      } else {
        endOfDay = new Date(startOfDay);
        endOfDay.setUTCHours(23, 59, 59, 999);
      }
    } else {
      startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
    }

    const [lastEma, skillActivities] = await Promise.all([
      this.findLastEmaByUserAndDate(userId, date),
      this.userSkillActivityRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(startOfDay, endOfDay),
        },
        relations: ['subSkill'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { lastEma, skillActivities };
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
