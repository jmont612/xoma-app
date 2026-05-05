import { IsString, IsInt, Length } from 'class-validator';

export class CreateSubSkillDto {
  @IsInt()
  skillId: number;

  @IsString()
  @Length(2, 100)
  name: string;
}
