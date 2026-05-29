import { PartialType } from '@nestjs/swagger';
import { CreateDailyQuoteDto } from './create-daily-quote.dto';

export class UpdateDailyQuoteDto extends PartialType(CreateDailyQuoteDto) {}
