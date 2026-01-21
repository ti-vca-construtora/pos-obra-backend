import { IsDateString, IsString } from 'class-validator';

export class AgendarVisitaDto {
  @IsDateString()
  dataInicioPrevisto: string;

  @IsDateString()
  dataFimPrevisto: string;

  @IsString()
  idColaborador: string;

  @IsString()
  objetivo: string;
}
