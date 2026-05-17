import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';

export class CreateDiaryBehaviorDto {
  @ApiProperty({ description: 'ID del diario', example: 1 })
  @IsInt()
  diaryId: number;

  @ApiProperty({ description: 'ID del comportamiento', example: 3 })
  @IsInt()
  behaviorId: number;

  @ApiProperty({ description: '¿El comportamiento ocurrió?', example: true })
  @IsBoolean()
  hasHappened: boolean;
}
