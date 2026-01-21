import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubgruposService } from './subgrupos.service';
import { CreateSubgrupoDto } from './dto/create-subgrupo.dto';
import { UpdateSubgrupoDto } from './dto/update-subgrupo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subgrupos')
export class SubgruposController {
  constructor(private readonly service: SubgruposService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateSubgrupoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-grupo/:grupoId')
  findByGrupo(@Param('grupoId') grupoId: string) {
    return this.service.findByGrupo(+grupoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubgrupoDto) {
    return this.service.update(+id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
