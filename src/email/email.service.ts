import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true se for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private carregarTemplate(
    nomeTemplate: string,
    variaveis: Record<string, string>,
  ): string {
    const caminho = path.join(
      __dirname,
      'templates',
      `${nomeTemplate}.html`,
    );

    let html = fs.readFileSync(caminho, 'utf-8');

    for (const chave in variaveis) {
      html = html.replace(
        new RegExp(`{{${chave}}}`, 'g'),
        variaveis[chave],
      );
    }

    return html;
  }

  async enviarEmergencial(params: {
    para: string;
    nome: string;
    protocolo: string;
    descricao: string;
  }) {
    try {
      const html = this.carregarTemplate('emergencia', {
        nome: params.nome,
        protocolo: params.protocolo,
        descricao: params.descricao,
      });

      await this.transporter.sendMail({
        from: `"Pós Obra" <${process.env.SMTP_FROM}>`,
        to: params.para,
        subject: '🚨 Atendimento Emergencial Registrado',
        html,
      });
    } catch (error) {
      console.error('ERRO AO ENVIAR EMAIL >>>', error);
      throw new InternalServerErrorException(
        'Erro ao enviar email de emergência',
      );
    }
  }
}
