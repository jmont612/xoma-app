import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Nombre de la habilidad DBT',
    example: 'Mindfulness',
  })
  @IsString()
  @Length(2, 100)
  name: string;
}
