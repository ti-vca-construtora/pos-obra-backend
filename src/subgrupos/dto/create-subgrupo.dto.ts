import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubgrupoDto {
  @IsString()
  nome: string;

  @Type(() => Number)
  @IsInt()
  grupoId: number;

  @IsOptional()
  @IsBoolean()
  emergencia?: boolean;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
