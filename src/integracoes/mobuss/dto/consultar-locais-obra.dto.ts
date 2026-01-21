import { IsString } from 'class-validator';

export class ConsultarLocaisObraDto {
  @IsString()
  idObra: string;
}
