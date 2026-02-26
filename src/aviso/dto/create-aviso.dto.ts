import {
  IsString,
  IsBoolean,
  IsDateString
} from 'class-validator';

export class CreateAvisoDto {

  @IsString()
  titulo: string;


  @IsString()
  descricao: string;


  @IsBoolean()
  ativo: boolean;


  @IsDateString()
  dataInicio: Date;


  @IsDateString()
  dataFim: Date;

}