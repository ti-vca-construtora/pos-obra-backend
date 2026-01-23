import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MobussService } from './mobuss.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { AgendarVisitaDto } from './dto/agendar-visita.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConsultarClienteDto } from './dto/consultar-cliente.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {Public} from 'src/auth/decorators/public.decorator';
import { ConsultarSolicitacoesClienteDto } from './dto/consultar-solicitacoes-cliente.dto';

@UseGuards(JwtAuthGuard)
@Controller('integracoes/mobuss')
export class MobussController {
  constructor(private readonly service: MobussService) {}

  @Public()
  @Post('atendimento')
  criarAtendimento(@Body() dto: CreateAtendimentoDto) {
    return this.service.criarAtendimento(dto);
  }

  @Public()
  @Post('atendimento/:id/disponibilidade')
consultarDisponibilidade(@Param('id') id: string) {
  return this.service.consultarDisponibilidade(id);
}

@Public()
@Post('atendimento/:id/agendar')
agendar(
  @Param('id') id: string,
  @Body() dto: AgendarVisitaDto,
) {
  return this.service.agendarVisita(id, dto);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PUBLIC')
@Post('solicitacoes-cliente')
consultarSolicitacoesCliente(
  @Body() dto: ConsultarSolicitacoesClienteDto,
) {
  return this.service.consultarSolicitacoesCliente(dto);
}


@Public()
@Post('public-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PUBLIC')
@Post('cliente')
consultarCliente(@Body() dto: ConsultarClienteDto) {
  return this.service.consultarCliente(dto.cpfCnpj);
}

}
