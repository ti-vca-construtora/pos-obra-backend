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
import { ConsultarLocaisObraDto } from './dto/consultar-locais-obra.dto';

@UseGuards(JwtAuthGuard)
@Controller('integracoes/mobuss')
export class MobussController {
  constructor(private readonly service: MobussService) {}

  @Post('atendimento')
  criarAtendimento(@Body() dto: CreateAtendimentoDto) {
    return this.service.criarAtendimento(dto);
  }

  @Post('atendimento/:id/disponibilidade')
consultarDisponibilidade(@Param('id') id: string) {
  return this.service.consultarDisponibilidade(id);
}

@Post('atendimento/:id/agendar')
agendar(
  @Param('id') id: string,
  @Body() dto: AgendarVisitaDto,
) {
  return this.service.agendarVisita(id, dto);
}

@UseGuards(JwtAuthGuard)
@Get('obras')
consultarObrasEmpresa() {
  return this.service.consultarObrasEmpresa();
}

@UseGuards(JwtAuthGuard)
@Post('obras/locais')
consultarLocaisObra(@Body() dto: ConsultarLocaisObraDto) {
  return this.service.consultarLocaisObra(dto.idObra);
}


}
