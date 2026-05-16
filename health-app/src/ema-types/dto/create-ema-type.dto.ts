import { IsEnum, IsString, Length } from 'class-validator';
import { EmaTypeEvaluationType } from '@/common/enums/ema-type-evaluation-type.enum';

export class CreateEmaTypeDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsEnum(EmaTypeEvaluationType)
  evaluationType: EmaTypeEvaluationType;
}
