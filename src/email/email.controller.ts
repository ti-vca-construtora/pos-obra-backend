import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('teste')
  async teste(@Body() body: { email: string }) {
    await this.emailService.enviar({
      para: body.email,
      assunto: 'Teste de Email',
      template: 'simples',
      variaveis: {
        nome: 'Jorge',
        mensagem: 'Este é um teste de envio simples.',
        protocolo: '123456',
      },
    });

    return { success: true };
  }
}

