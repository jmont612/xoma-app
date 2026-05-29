import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Gender } from '@/common/enums/gender.enum';

export class ResponseUserDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Juan' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: 'juanperez' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'juan@email.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 25 })
  @Expose()
  age: number;

  @ApiProperty({ enum: Gender, example: 'male' })
  @Expose()
  gender: Gender;

  @ApiProperty({ example: true })
  @Expose()
  consentAccepted: boolean;
}
