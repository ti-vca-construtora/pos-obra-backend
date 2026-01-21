import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExampleDto } from "./dto/create-example.dto";
import { UpdateExampleDto } from "./dto/update-example.dto";

@Injectable()
export class ExamplesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateExampleDto, filePath?: string) {
    return this.prisma.example.create({
      data: {
        ...dto,
        filePath: filePath ? filePath.replace(/\\/g, '/') : null,
      },
    });
  }

  findAll() {
    return this.prisma.example.findMany();
  }

  findOne(id: number) {
    return this.prisma.example.findUnique({ where: { id } });
  }

  update(id: number, dto: UpdateExampleDto) {
    return this.prisma.example.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.example.delete({ where: { id } });
  }
}
