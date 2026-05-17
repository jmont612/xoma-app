import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Length } from 'class-validator';

export class CreateSubSkillDto {
  @ApiProperty({ description: 'ID de la habilidad padre', example: 1 })
  @IsInt()
  skillId: number;

  @ApiProperty({
    description: 'Nombre de la sub-habilidad',
    example: 'Respiración diafragmática',
  })
  @IsString()
  @Length(2, 100)
  name: string;
}
