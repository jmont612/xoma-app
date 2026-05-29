import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateMoodStateDto {
  @ApiProperty({
    description: 'Nombre del estado de ánimo',
    example: 'Ansioso',
  })
  @IsString()
  @Length(2, 50)
  name: string;
}
