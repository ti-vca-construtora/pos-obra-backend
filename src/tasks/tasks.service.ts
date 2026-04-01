import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MobussService } from '../integracoes/mobuss/mobuss.service';
import { EmailService } from 'src/email/email.service';
import { HuggyService } from 'src/integracoes/huggy/huggy.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mobussService: MobussService,
    private readonly emailService: EmailService,
    private readonly huggyService: HuggyService,
  ) {}

  private async enviarFlowWhatsapp(
    telefone: string,
    nomeContato: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    const phone = telefone.replace(/\D/g, '');

    if (!phone) {
      throw new BadRequestException('Telefone inválido');
    }

    let contato = await this.huggyService.buscarContatoPorTelefone(phone);

    if (!contato) {
      contato = await this.huggyService.criarContato(
        nomeContato || 'Cliente',
        phone,
      );
    }

    await this.huggyService.executarFlow(contato.id, variables);
  }

  async enviarMensagemWhatsappTeste(
    telefone: string,
    mensagem: string,
  ): Promise<{ message: string; telefone: string }> {
    if (!mensagem?.trim()) {
      throw new BadRequestException('Mensagem é obrigatória');
    }

    const variables = {
      mensagem: mensagem.trim(),
      nomecliente: 'Cliente',
    };

    await this.enviarFlowWhatsapp(telefone, 'Cliente', variables);

    return {
      message: 'Mensagem de teste enviada para a fila de envio do WhatsApp',
      telefone: telefone.replace(/\D/g, ''),
    };
  }

  @Cron('0 9,18 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async sincronizarAtendimentosMobuss(): Promise<void> {

    this.logger.log('Início da sincronização Mobuss');

    const atendimentos = await this.prisma.atendimentoMobuss.findMany({
      where: {
        status: {
          notIn: ['CONCLUIDO', 'CANCELADO', 'ERRO'],
        },
      },
    });

    for (const atendimento of atendimentos) {

      try {

        const resposta =
          await this.mobussService.consultarSituacaoAtendimento(
            atendimento.idMobuss,
          );

        const novaSituacao = resposta?.situacao;
        const dataAgendamento = resposta?.dataAgendamento;

        // Atualiza status
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

        // Verificar data de agendamento
        if (dataAgendamento) {

          const data = new Date(dataAgendamento);
          const hoje = new Date();

          const diffMs = data.getTime() - hoje.getTime();
          const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          // Se visita é amanhã
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

            // 🔥 ENVIO WHATSAPP
            try {

              const cliente =
                await this.mobussService.consultarCliente(
                  atendimento.cpfCnpjCliente,
                );

              const telefone =
                cliente?.telefone || cliente?.celular;

              if (!telefone) {

                this.logger.warn(
                  `Cliente sem telefone ${atendimento.id}`,
                );

                continue;
              }

              await this.enviarFlowWhatsapp(
                telefone,
                atendimento.nomeSolicitante ?? 'Cliente',
                {
                  nomecliente: atendimento.nomeSolicitante,
                  datavisita: data.toLocaleDateString('pt-BR'),
                  horariovisita: data.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  local: resposta?.local ?? 'Seu empreendimento',
                },
              );

              this.logger.log(
                `WhatsApp enviado ${atendimento.id}`,
              );

            } catch (err) {

              this.logger.error(
                `Erro envio WhatsApp atendimento ${atendimento.id}`,
                err,
              );

            }

          }
        }

      } catch (error) {
        if (error instanceof NotFoundException) {
          await this.prisma.atendimentoMobuss.update({
            where: { id: atendimento.id },
            data: {
              status: 'CANCELADO',
              payloadResposta: (error as NotFoundException).getResponse(),
            },
          });

          this.logger.warn(
            `Atendimento ${atendimento.id} não localizado na Mobuss; marcado como CANCELADO`,
          );

          continue;
        }

        this.logger.error(
          `Erro ao sincronizar atendimento ${atendimento.id}`,
          error,
        );

      }
    }

    this.logger.log('Sincronização finalizada');
  }
}