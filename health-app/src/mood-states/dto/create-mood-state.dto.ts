import { IsString, Length } from 'class-validator';

export class CreateMoodStateDto {
  @IsString()
  @Length(2, 50)
  name: string;
}
