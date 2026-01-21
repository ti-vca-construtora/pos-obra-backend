import { IsString } from 'class-validator';

export class ConsultarDisponibilidadeDto {
  @IsString()
  idMobuss: string;
}
