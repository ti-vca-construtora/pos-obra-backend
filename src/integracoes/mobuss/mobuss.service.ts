import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { AgendarVisitaDto } from './dto/agendar-visita.dto';
import { ConsultarSolicitacoesClienteDto } from './dto/consultar-solicitacoes-cliente.dto';
import { EmailService } from 'src/email/email.service';

import { addDays, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

import FormData from 'form-data';
import { UpdateManualDto } from './dto/update-manual.dto';

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
     // Enviar email para qualquer atendimento
try {
  await this.emailService.enviar({
    para: dto.emailSolicitante,
    assunto: isEmergencial
      ? 'Atendimento Emergencial'
      : 'Solicitação registrada com sucesso',
    template: 'emergencia',
    variaveis: {
      nome_cliente: dto.nomeSolicitante,
      id_protocolo: numSolicitacao,
      descricao_servico: dto.desSolicitacao,
      nome_empresa: 'VCA Construtora',
      local_unidade: '-',
      data_criacao: new Date().toLocaleDateString('pt-BR'),
      tipo_servico: 'Pós-Obra',

      tag_urgente: isEmergencial
        ? `
        <p>
          <span class="urgent-tag">Atendimento Urgente</span><br>
          <small style="color:#666;">
            Identificamos que sua solicitação é prioritária e nossa equipe entrará em contato o mais breve possível.
          </small>
        </p>
        `
        : '',
    },
  });

  // Email interno
if (isEmergencial) {
  await this.emailService.enviar({
    para: 'urgencia.posobra@vcaconstrutora.com.br',
    assunto: `🚨 NOVO ATENDIMENTO EMERGENCIAL - ${numSolicitacao}`,
    template: 'alerta-interno',
    variaveis: {
      nome_cliente: dto.nomeSolicitante,
      protocolo: numSolicitacao,
      descricao: dto.desSolicitacao,
    },
  });
}
} catch (err) {
  console.error('ERRO AO ENVIAR EMAIL (IGNORADO) >>>', err);
}

// Retorno único
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

          //  CAMPOS OBRIGATÓRIOS
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
  const timeZone = 'America/Sao_Paulo';

  // data atual no fuso do Brasil
  const agoraBrasil = new Date(
    new Date().toLocaleString('en-US', { timeZone }),
  );

  // +3 dias e início do dia (00:00)
  const inicioBrasil = startOfDay(addDays(agoraBrasil, 3));

  // converte para UTC (Mobuss espera ISO)
  const inicioUTC = fromZonedTime(inicioBrasil, timeZone);

  return {
    dataHoraInicio: inicioUTC.toISOString(),
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


async consultarSituacaoAtendimento(idSolicitacaoAtendimento: string) {
  const payload = {
    idSolicitacaoAtendimento,
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

    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 404 && data?.codigoInterno === 'SAT-AT002') {
      throw new NotFoundException(
        data ||
          `Solicitação Mobuss não localizada para id (${idSolicitacaoAtendimento})`,
      );
    }

    throw new InternalServerErrorException(
      data || 'Erro ao consultar situação do atendimento',
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

    const solicitacoes = response.data?.solicitacaoAtendimento;

    if (!Array.isArray(solicitacoes) || solicitacoes.length === 0) {
      return response.data;
    }

    const idsMobuss = solicitacoes
      .map((solicitacao: { id?: string }) => solicitacao.id)
      .filter((id): id is string => Boolean(id));

    if (idsMobuss.length === 0) {
      return response.data;
    }

    const atendimentos = await this.prisma.atendimentoMobuss.findMany({
      where: {
        idMobuss: {
          in: idsMobuss,
        },
      },
      select: {
        id: true,
        idMobuss: true,
      },
    });

    const atendimentoIdPorIdMobuss = new Map(
      atendimentos.map((atendimento) => [atendimento.idMobuss, atendimento.id]),
    );

    return {
      ...response.data,
      solicitacaoAtendimento: solicitacoes.map(
        (solicitacao: Record<string, unknown> & { id?: string }) => ({
          ...solicitacao,
          atendimentoId: solicitacao.id
            ? atendimentoIdPorIdMobuss.get(solicitacao.id) ?? null
            : null,
        }),
      ),
    };
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

  const formData = new FormData();

  // ⚠️ AQUI É A DIFERENÇA
  formData.append('anexo', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const nomeSemExtensao = file.originalname
    .split('.')
    .slice(0, -1)
    .join('.');

  const headers = {
    Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
    idLegadoAnexo: `${atendimento.idMobuss}_${nomeSemExtensao}`,
    idMobussOrigem: atendimento.idMobuss,
    nomeAnexo: nomeSemExtensao,
    ...formData.getHeaders(), 
  };

  const response = await firstValueFrom(
    this.http.post(
      `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/incluirAnexoSolicitacaoAtendimento`,
      formData,
      { headers },
    ),
  );

  return response.data;
}

async consultarObras() {

  const response = await firstValueFrom(
    this.http.post(
      `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/consultarObrasEmpresa`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
        },
      },
    ),
  );


  return response.data;

}


async cancelarVisita(idVisita: string) {


   // 1. buscar no banco
    const agendamento =
    await this.prisma.agendamentoMobuss.findUnique({
      where: { idVisita }
    });


  if (!agendamento) {
    throw new NotFoundException(
      'Agendamento não encontrado'
    );
  }

  // 2. calcular diferença
  const agora = new Date();

  const dataVisita =
    new Date(agendamento.dataInicio);

  const diferencaMs =
    dataVisita.getTime() - agora.getTime();

  const diferencaHoras =
    diferencaMs / (1000 * 60 * 60);

    // 3. validar regra

  if (diferencaHoras <= 48) {
    throw new BadRequestException(
      'A visita não pode ser cancelada com menos de 48 horas de antecedência'
    );
  }

  try {

    const payload = {
      idVisita,
    };

    const response = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/ccapi/assistencia/solicitacao/v1/cancelarAgendamentoVisitaSolicitacao`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOBUSS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    // 5. atualizar status local
    await this.prisma.atendimentoMobuss.update({
      where: {
        id: agendamento.atendimentoId
      },
      data: {
        status: 'CANCELADO'
      }
    });

     return {
      message: 'Visita cancelada com sucesso',
      ...response.data
    };

  } catch (error: any) {

    console.error('ERRO MOBUSS CANCELAR VISITA >>>', {
      payload: { idVisita },
      status: error?.response?.status,
      data: error?.response?.data,
    });

    throw new InternalServerErrorException(
      error?.response?.data || 'Erro ao cancelar visita',
    );
  }
}


async sincronizarObras() {

  // 1. busca na mobuss
  const response = await this.consultarObras();

  const obras = response.obras ?? [];

  let criados = 0;
  let existentes = 0;

  for (const obra of obras) {

    const existe = await this.prisma.empreendimentoMobuss.findUnique({
      where: {
        idMobuss: obra.id
      }
    });

    if (!existe) {

      await this.prisma.empreendimentoMobuss.create({
        data: {
          idMobuss: obra.id,
          nome: obra.nome
        }
      });

      criados++;

    } else {

      existentes++;

      // opcional atualizar nome
      if (existe.nome !== obra.nome) {

        await this.prisma.empreendimentoMobuss.update({
          where: {
            id: existe.id
          },
          data: {
            nome: obra.nome
          }
        });
      }
    }
  }

  return {
    totalMobuss: obras.length,
    criados,
    existentes
  };
}

async listarEmpreendimentos() {
  return this.prisma.empreendimentoMobuss.findMany({
    orderBy: {
      nome: 'asc'
    }
  });
}

async atualizarManual(
  id: string,
  dto: UpdateManualDto
) {

  const empreendimento =
    await this.prisma.empreendimentoMobuss.findUnique({
      where: { id }
    });

  if (!empreendimento) {
    throw new NotFoundException(
      'Empreendimento não encontrado'
    );
  }


  return this.prisma.empreendimentoMobuss.update({
    where: { id },
    data: {
      manualUrl: dto.manualUrl
    }
  });
}



}
