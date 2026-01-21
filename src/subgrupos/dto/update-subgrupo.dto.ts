import { PartialType } from '@nestjs/mapped-types';
import { CreateSubgrupoDto } from './create-subgrupo.dto';

export class UpdateSubgrupoDto extends PartialType(CreateSubgrupoDto) {}
