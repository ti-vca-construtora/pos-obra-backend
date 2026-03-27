import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EnviarWhatsappTesteDto } from './dto/enviar-whatsapp-teste.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('whatsapp/teste')
  enviarWhatsappTeste(@Body() dto: EnviarWhatsappTesteDto) {
    return this.tasksService.enviarMensagemWhatsappTeste(
      dto.telefone,
      dto.mensagem,
    );
  }
}
