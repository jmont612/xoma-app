import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBehaviorDto {
  @ApiProperty({
    description: 'Nombre del comportamiento',
    example: 'Evitación social',
  })
  @IsString()
  @Length(2, 50)
  name: string;
}
