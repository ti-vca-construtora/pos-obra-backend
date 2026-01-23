import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { AgendarVisitaDto } from './dto/agendar-visita.dto';
import { ConsultarSolicitacoesClienteDto } from './dto/consultar-solicitacoes-cliente.dto';

@Injectable()
export class MobussService {
   private readonly baseUrl = process.env.MOBUSS_BASE_URL;

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // ETAPA 1 — Incluir Solicitação de Atendimento
  async criarAtendimento(dto: CreateAtendimentoDto) {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/incluirSolicitacaoAtendimento`,
          dto,
          {
            headers: {
              Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const { idMobuss, numSolicitacao } = response.data;

      // Persistir no banco
      const atendimento = await this.prisma.atendimentoMobuss.create({
        data: {
          idMobuss,
          numSolicitacao,
          status: 'AGUARDANDO_AGENDAMENTO',

           cpfCnpjCliente: dto.cpfCnpjCliente,
           nomeSolicitante: dto.nomeSolicitante,
           emailSolicitante: dto.emailSolicitante,

          payloadEnvio: {...dto},
          payloadResposta: response.data,
        },
      });

      return {
        atendimentoId: atendimento.id,
        idMobuss,
        numSolicitacao,
      };
    } catch (error: any) {
      // Persistir erro (opcional)
      await this.prisma.atendimentoMobuss.create({
        data: {
          idMobuss: `ERRO_${Date.now()}`,
          numSolicitacao:null,
          status: 'ERRO',

          // 🔑 CAMPOS OBRIGATÓRIOS
         cpfCnpjCliente: dto.cpfCnpjCliente,
         nomeSolicitante: dto.nomeSolicitante,
         emailSolicitante: dto.emailSolicitante,

          payloadEnvio: {...dto},
          payloadResposta: error?.response?.data ?? error.message,
        },
      });

      throw new InternalServerErrorException(
        'Erro ao criar atendimento na Mobuss',
      );
    }
  }

private getDataConsulta() {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() + 1);
  inicio.setHours(0, 0, 0, 0);

  return {
    dataHoraInicio: inicio.toISOString(),
    numDisponibilidades: 6,
  };
}


async consultarDisponibilidade(atendimentoId: string) {
  const atendimento = await this.prisma.atendimentoMobuss.findUnique({
    where: { id: atendimentoId },
  });

  if (!atendimento) {
    throw new Error('Atendimento não encontrado');
  }

  const datas = this.getDataConsulta();

  try {
    const payload = {
      idSolicitacaoAtendimento: atendimento.idMobuss,
      ...datas,
    };

    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/consultarDisponibilidadeAgendamento`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  } catch (error: any) {
    console.error('ERRO MOBUSS DISPONIBILIDADE >>>', {
      payload: {
        idSolicitacaoAtendimento: atendimento.idMobuss,
        ...datas,
      },
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao consultar disponibilidade',
    );
  }
}


async agendarVisita(atendimentoId: string, dto: AgendarVisitaDto) {
  const atendimento = await this.prisma.atendimentoMobuss.findUnique({
    where: { id: atendimentoId },
    include: { agendamento: true },
  });

  if (!atendimento) {
    throw new Error('Atendimento não encontrado');
  }

  if (atendimento.agendamento) {
    throw new Error('Atendimento já possui agendamento');
  }

  const payload = {
    idSolicitacaoAtendimento: atendimento.idMobuss,
    tipoVisita: 'VISTORIA',
    objetivo: dto.objetivo,
    dataInicioPrevisto: dto.dataInicioPrevisto,
    dataFimPrevisto: dto.dataFimPrevisto,
    idColaborador: dto.idColaborador,
  };

  try {
    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/incluirAgendamentoVisitaSolicitacao`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const { idVisita } = response.data;

    await this.prisma.agendamentoMobuss.create({
      data: {
        idVisita,
        dataInicio: new Date(dto.dataInicioPrevisto),
        dataFim: new Date(dto.dataFimPrevisto),
        idColaborador: dto.idColaborador,
        atendimentoId: atendimento.id,
        payloadEnvio: { ...payload },
        payloadResposta: response.data,
      },
    });

    await this.prisma.atendimentoMobuss.update({
      where: { id: atendimento.id },
      data: { status: 'AGENDADO' },
    });

    return {
      status: 'AGENDADO',
      idVisita,
    };
  } catch (error: any) {
    console.error('ERRO MOBUSS AGENDAMENTO >>>', {
      payload,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao agendar visita',
    );
  }
}

async consultarSituacaoAtendimento(atendimentoId: string) {
  const atendimento = await this.prisma.atendimentoMobuss.findUnique({
    where: { id: atendimentoId },
  });

  if (!atendimento) {
    throw new Error('Atendimento não encontrado');
  }

  const payload = {
    idSolicitacaoAtendimento: atendimento.idMobuss,
  };

  try {
    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/consultarSolicitacaoAtendimento`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  } catch (error: any) {
    console.error('ERRO MOBUSS CONSULTA STATUS >>>', {
      payload,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao consultar situação do atendimento',
    );
  }
}

async consultarCliente(cpfCnpj: string) {
  try {
    const payload = {
      cpfCnpj,
    };

    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/consultarCliente`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  } catch (error: any) {
    console.error('ERRO MOBUSS CONSULTAR CLIENTE >>>', {
      payload: { cpfCnpj },
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao consultar cliente na Mobuss',
    );
  }
}

async consultarSolicitacoesCliente(dto: ConsultarSolicitacoesClienteDto) {
  try {
    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/consultarSolicitacoesCliente`,
        {
          numCPFCNPJ: dto.numCPFCNPJ,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  } catch (error: any) {
    console.error('ERRO MOBUSS CONSULTAR SOLICITAÇÕES >>>', {
      payload: dto,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao consultar solicitações do cliente',
    );
  }
}





}
