import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password,10);

    return this.prisma.user.create({
      data: {
        email:dto.email,
        nome:dto.nome,
        password:hashedPassword,
      },
      select:{
        id:true,
        email:true,
        nome:true,
        role:true,
        active:true,
        createdAt:true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }  
}
