import { IsString } from 'class-validator';

export class CancelarVisitaDto {

  @IsString()
  idVisita: string;

}