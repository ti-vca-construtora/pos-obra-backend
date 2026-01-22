
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        nome: dto.nome,
        password: hashedPassword,
        role: dto.role ?? 'USER',
        active: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }


async update(id: number, dto: UpdateUserDto) {
  const data: any = { ...dto };

  if (dto.password) {
    data.password = await bcrypt.hash(dto.password, 10);
  }

  return this.prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      nome: true,
      role: true,
      active: true,
    },
  });
}

async remove(id: number) {
  return this.prisma.user.update({
    where: { id },
    data: {
      active: false,
    },
  });
}




}
