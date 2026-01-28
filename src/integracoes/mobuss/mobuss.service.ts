import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { AgendarVisitaDto } from './dto/agendar-visita.dto';
import { ConsultarSolicitacoesClienteDto } from './dto/consultar-solicitacoes-cliente.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class MobussService {
   private readonly baseUrl = process.env.MOBUSS_BASE_URL;

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ETAPA 1 — Incluir Solicitação de Atendimento
  async criarAtendimento(dto: CreateAtendimentoDto) {
let isEmergencial = false;

if (dto.subgrupoId) {
  const subgrupo = await this.prisma.subgrupo.findUnique({
    where: { id: dto.subgrupoId },
  });

  if (!subgrupo || !subgrupo.status) {
    throw new BadRequestException('Subgrupo inválido ou inativo');
  }

  isEmergencial = subgrupo.emergencia === true;
}

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
          status: isEmergencial ? 'EMERGENCIAL' : 'AGUARDANDO_AGENDAMENTO',

           cpfCnpjCliente: dto.cpfCnpjCliente,
           nomeSolicitante: dto.nomeSolicitante,
           emailSolicitante: dto.emailSolicitante,

          payloadEnvio: {...dto},
          payloadResposta: response.data,
        },
      });

      //  4. Se for emergencial → ENCERRA fluxo
    if (isEmergencial) {
      // enviar email aqui
       await this.emailService.enviarEmergencial({
         para: dto.emailSolicitante,
         nome: dto.nomeSolicitante,
         protocolo: numSolicitacao,
         descricao: dto.desSolicitacao,
       }).catch((err)=>{
         console.error('ERRO AO ENVIAR EMAIL (IGNORADO) >>>', err);
       });

      return {
        atendimentoId: atendimento.id,
        idMobuss,
        numSolicitacao,
        emergencial: true,
        podeAgendar: false,
        mensagem:
          'Chamado emergencial registrado. Nossa equipe entrará em contato.',
      };
    }

      // 🔹 5. Fluxo normal
    return {
      atendimentoId: atendimento.id,
      idMobuss,
      numSolicitacao,
      emergencial: isEmergencial,
      podeAgendar: !isEmergencial,
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
    idSolicitacaoAtendimento: atendimento.idMobuss, // ✔ CORRETO
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


async anexarArquivo(
  atendimentoId: string,
  file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('Arquivo não enviado');
  }

  const atendimento = await this.prisma.atendimentoMobuss.findUnique({
    where: { id: atendimentoId },
  });

  if (!atendimento) {
    throw new NotFoundException('Atendimento não encontrado');
  }

  const payload = {
    idSolicitacao: atendimento.idMobuss,
    nomeArquivo: file.originalname,
    arquivoBase64: file.buffer.toString('base64'),
  };

  const response = await firstValueFrom(
    this.http.post(
      `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/incluirAnexoSolicitacaoAtendimento`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    ),
  );

  return {
    success: true,
    atendimentoId: atendimento.id,
    mobuss: response.data,
  };
}


}
