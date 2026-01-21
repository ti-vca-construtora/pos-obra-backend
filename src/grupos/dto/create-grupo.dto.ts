import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateGrupoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
