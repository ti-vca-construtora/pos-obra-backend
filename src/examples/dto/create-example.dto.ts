import { Transform } from 'class-transformer';
import { IsBoolean, IsBooleanString, IsOptional, IsString } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  title: string;

  @IsOptional()
 // @IsBooleanString()
 @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1' || value === 'on';
  })
  active?: boolean;
}
