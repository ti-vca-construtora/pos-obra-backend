import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MobussService } from '../integracoes/mobuss/mobuss.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mobussService: MobussService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Executa a cada 4 horas
   * Responsável por sincronizar a situação dos atendimentos
   * com a API da Mobuss
   */
 
  @Cron('0 9,18 * * *', {
  timeZone: 'America/Sao_Paulo',
})
async sincronizarAtendimentosMobuss(): Promise<void> {
  this.logger.log('Início da sincronização Mobuss');

  const atendimentos = await this.prisma.atendimentoMobuss.findMany({
    where: {
      status: {
        notIn: ['CONCLUIDO', 'CANCELADO'],
      },
    },
  });

  for (const atendimento of atendimentos) {
    try {
      const resposta =
        await this.mobussService.consultarSituacaoAtendimento(
          atendimento.idMobuss, // 🔥 CORRIGIDO
        );

      const novaSituacao = resposta?.situacao;
      const dataAgendamento = resposta?.dataAgendamento; // depende da API real

      // 1️⃣ Atualiza status se mudou
      if (novaSituacao && novaSituacao !== atendimento.status) {
        await this.prisma.atendimentoMobuss.update({
          where: { id: atendimento.id },
          data: {
            status: novaSituacao,
            payloadResposta: resposta,
          },
        });

        this.logger.log(
          `Status atualizado: ${atendimento.id} → ${novaSituacao}`,
        );
      }

      // 2️⃣ Verificar se existe data
      if (dataAgendamento) {
        const data = new Date(dataAgendamento);
        const hoje = new Date();

        const diffMs = data.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // ⚠️ Se vence em 1 dia
        if (diffDias === 1 && atendimento.emailSolicitante) {
          await this.emailService.enviar({
            para: atendimento.emailSolicitante,
            assunto: '⚠️ Seu atendimento vence amanhã',
            template: 'alerta-vencimento',
            variaveis: {
              nome: atendimento.nomeSolicitante ?? '',
              protocolo: resposta?.numSolicitacao ?? '',
              data: data.toLocaleDateString('pt-BR'),
            },
          });

          this.logger.log(
            `Alerta enviado para atendimento ${atendimento.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao sincronizar atendimento ${atendimento.id}`,
        error,
      );
    }
  }

  this.logger.log('Sincronização finalizada');
}


}
