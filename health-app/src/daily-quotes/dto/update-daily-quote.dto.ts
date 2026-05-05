import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyQuoteDto } from './create-daily-quote.dto';

export class UpdateDailyQuoteDto extends PartialType(CreateDailyQuoteDto) {}
