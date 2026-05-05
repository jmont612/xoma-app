import { Module } from '@nestjs/common';
import { DailyQuotesService } from './daily-quotes.service';
import { DailyQuotesController } from './daily-quotes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyQuote } from './entities/daily-quote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyQuote])],
  controllers: [DailyQuotesController],
  providers: [DailyQuotesService],
  exports: [DailyQuotesService],
})
export class DailyQuotesModule {}
