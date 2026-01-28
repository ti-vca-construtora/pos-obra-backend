import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";

import * as bcrypt from 'bcrypt';
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private gerarToken(payload: any) {
  if (payload.role === 'ADMIN') {
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  if (payload.role === 'PUBLIC') {
    return this.jwtService.sign(payload); // sem expiração
  }

  return this.jwtService.sign(payload, { expiresIn: '7d' });
}


  async login(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.gerarToken(payload),
      user:{
        id:user.id,
        email:user.email,
        nome:user.nome,
        role:user.role,
      },
    };
  }

  //criar um novo usuario
  async register(dto: RegisterDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nome: dto.nome,
        role: 'ADMIN',
        active: true,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }


  generatePublicToken() {
  const payload = {
    role: 'PUBLIC',
    system: 'site-institucional',
  };

  return {
    access_token: this.jwtService.sign(payload), // sem expiresIn
  };
}


  //fim da classe
}
