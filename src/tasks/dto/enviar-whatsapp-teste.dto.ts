import { IsString, MinLength } from 'class-validator';

export class EnviarWhatsappTesteDto {
  @IsString()
  telefone: string;

  @IsString()
  @MinLength(1)
  mensagem: string;
}
