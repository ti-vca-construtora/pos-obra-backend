import { IsUrl, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateManualDto {

  @IsOptional()
  @IsUrl()
  manualUrl?: string;

}