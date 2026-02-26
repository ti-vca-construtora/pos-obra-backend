import {

  Controller,
  Get,
  Post,
  Put,
  Body,
  Param

} from '@nestjs/common';

import { AvisoService } from './aviso.service';

import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';


@Controller('site/avisos')
export class AvisoController {

  constructor(
    private readonly service: AvisoService
  ) {}



  @Get()
  listar() {

    return this.service.listar();

  }



  @Get('ativo')
  ativo() {

    return this.service.obterAtivo();

  }



  @Post()
  criar(
    @Body() dto: CreateAvisoDto
  ) {

    return this.service.criar(dto);

  }



  @Put(':id')
  atualizar(

    @Param('id') id: string,

    @Body() dto: UpdateAvisoDto

  ) {

    return this.service.atualizar(id, dto);

  }



}