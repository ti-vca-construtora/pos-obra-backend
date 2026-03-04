import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

interface EnviarEmailParams {
  para: string;
  assunto: string;
  template: string;
  variaveis?: Record<string, string | number>;
}

@Injectable()
export class EmailService {

  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('RESEND_API_KEY'),
    );
  }

  private carregarTemplate(
    nomeTemplate: string,
    variaveis: Record<string, string | number> = {},
  ): string {

    const caminhoDev = path.join(
      process.cwd(),
      'src',
      'email',
      'templates',
      `${nomeTemplate}.html`,
    );

    const caminhoProd = path.join(
      __dirname,
      'templates',
      `${nomeTemplate}.html`,
    );

    let caminhoFinal = '';

    if (fs.existsSync(caminhoDev)) {
      caminhoFinal = caminhoDev;
    } else if (fs.existsSync(caminhoProd)) {
      caminhoFinal = caminhoProd;
    } else {
      throw new Error(`Template ${nomeTemplate} não encontrado`);
    }

    let html = fs.readFileSync(caminhoFinal, 'utf-8');

    for (const chave in variaveis) {
      html = html.replace(
        new RegExp(`{{${chave}}}`, 'g'),
        String(variaveis[chave]),
      );
    }

    return html;
  }

  async enviar(params: EnviarEmailParams) {
    try {

      const html = this.carregarTemplate(
        params.template,
        params.variaveis,
      );

      await this.resend.emails.send({
        from: `Pós Obra <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: params.para,
        subject: params.assunto,
        html: html,
      });

      return true;

    } catch (error) {
      console.error('ERRO AO ENVIAR EMAIL >>>', error);

      throw new InternalServerErrorException(
        'Erro ao enviar email',
      );
    }
  }
}