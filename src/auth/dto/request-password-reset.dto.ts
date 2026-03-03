import { Matches, IsString  } from 'class-validator';

export class RequestPasswordResetDto {

  @IsString()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^\d{11}$/, {
    message: 'Informe um email válido ou CPF com 11 dígitos',
  })
  identifier: string;

}