import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { DailyQuote } from './entities/daily-quote.entity';
import { CreateDailyQuoteDto } from './dto/create-daily-quote.dto';
import { UpdateDailyQuoteDto } from './dto/update-daily-quote.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class DailyQuotesService {
  constructor(
    @InjectRepository(DailyQuote)
    private readonly dailyQuoteRepository: Repository<DailyQuote>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDailyQuoteDto: CreateDailyQuoteDto,
    manager?: EntityManager,
  ): Promise<DailyQuote> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const existingQuote = await this.dailyQuoteRepository.findOne({
          where: { day: createDailyQuoteDto.day },
        });

        if (existingQuote) {
          throw new ConflictException('Quote for this day already exists');
        }

        const dailyQuote = manager.create(DailyQuote, createDailyQuoteDto);
        return await manager.save(dailyQuote);
      },
      manager,
    );
  }

  async findAll(): Promise<DailyQuote[]> {
    return await this.dailyQuoteRepository.find({
      order: { day: 'ASC' },
    });
  }

  async findByDay(day: number): Promise<DailyQuote> {
    const quote = await this.dailyQuoteRepository.findOne({
      where: { day },
    });

    if (!quote) {
      throw new NotFoundException('Quote for this day not found');
    }

    return quote;
  }

  async findOne(id: number): Promise<DailyQuote> {
    const dailyQuote = await this.dailyQuoteRepository.findOne({
      where: { id },
    });

    if (!dailyQuote) {
      throw new NotFoundException('Daily quote not found');
    }

    return dailyQuote;
  }

  async update(
    id: number,
    updateDailyQuoteDto: UpdateDailyQuoteDto,
    manager?: EntityManager,
  ): Promise<DailyQuote> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const dailyQuote = await this.findOne(id);
        Object.assign(dailyQuote, updateDailyQuoteDto);
        return await manager.save(dailyQuote);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(DailyQuote, id);
        return 'Daily quote deleted successfully';
      },
      manager,
    );
  }
}
