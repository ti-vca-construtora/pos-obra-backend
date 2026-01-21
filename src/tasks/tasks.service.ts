import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MobussService } from '../integracoes/mobuss/mobuss.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mobussService: MobussService,
  ) {}

  /**
   * Executa a cada 4 horas
   * Responsável por sincronizar a situação dos atendimentos
   * com a API da Mobuss
   */
  
@Cron('0 */4 * * *')
async sincronizarAtendimentosMobuss(): Promise<void> {
  this.logger.log('Início da varredura de atendimentos pendentes');

  const atendimentos = await this.prisma.atendimentoMobuss.findMany({
    where: {
      status: {
        in: ['AGUARDANDO_AGENDAMENTO', 'EM_ANALISE'],
      },
    },
    select: {
      id: true,
      idMobuss: true,
      status: true,
    },
  });

  for (const atendimento of atendimentos) {
    try {
      const resposta =
        await this.mobussService.consultarSituacaoAtendimento(atendimento.id);

      const novaSituacao = resposta?.situacao;

      if (!novaSituacao || novaSituacao === atendimento.status) {
        continue;
      }

      await this.prisma.atendimentoMobuss.update({
        where: { id: atendimento.id },
        data: {
          status: novaSituacao,
          payloadResposta: resposta,
        },
      });

      this.logger.log(
        `Atendimento ${atendimento.id} atualizado: ${atendimento.status} → ${novaSituacao}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar atendimento ${atendimento.id}`,
        error,
      );
    }
  }

  this.logger.log(
    `Finalizada varredura de ${atendimentos.length} atendimentos`,
  );
}


}
