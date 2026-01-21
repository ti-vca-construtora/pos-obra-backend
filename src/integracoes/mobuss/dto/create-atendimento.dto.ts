import { IsDateString, IsEmail, IsString } from 'class-validator';

export class CreateAtendimentoDto {
  @IsString()
  cpfCnpjCliente: string;

  @IsDateString()
  dataAberturaSolicitacao: string;

  @IsString()
  desSolicitacao: string;

  @IsEmail()
  emailSolicitante: string;

  @IsString()
  nomeSolicitante: string;

  @IsString()
  telefoneSolicitante: string;

  @IsString()
  idLocal: string;
}