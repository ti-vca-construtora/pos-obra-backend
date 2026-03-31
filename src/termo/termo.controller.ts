import {
  Controller,
  Get,
  Put,
  Body
} from '@nestjs/common';

import { TermoService } from './termo.service';

@Controller('site/termo')
export class TermoController {


  constructor(
    private readonly service: TermoService
  ) {}

  @Get()
  getTermo() {
    return this.service.getTermo();
  }

  @Put()
  salvarTermo(
    @Body('conteudo')
    conteudo: string
  ) {
    return this.service.salvarTermo(conteudo);

  }



}