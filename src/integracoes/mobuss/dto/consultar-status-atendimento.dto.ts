// dto/consultar-status-atendimento.dto.ts
import { IsString } from 'class-validator';

export class ConsultarStatusAtendimentoDto {
  @IsString()
  idSolicitacaoAtendimento: string;
}
