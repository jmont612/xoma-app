import { IsString, Length } from 'class-validator';

export class CreateBehaviorDto {
  @IsString()
  @Length(2, 50)
  name: string;
}
