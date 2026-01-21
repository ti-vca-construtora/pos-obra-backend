import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMotivoDto {
  @IsString()
  descricao: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
