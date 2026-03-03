import { IsString, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {

  @IsString()
  identifier: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  novaSenha: string;

}