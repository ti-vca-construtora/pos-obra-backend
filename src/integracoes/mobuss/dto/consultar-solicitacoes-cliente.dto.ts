import { IsString } from 'class-validator';

export class ConsultarSolicitacoesClienteDto {
  @IsString()
  numCPFCNPJ: string;
}
