import { IsString } from 'class-validator';

export class ConsultarClienteDto {
  @IsString()
  cpfCnpj: string;
}
