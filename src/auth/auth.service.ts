import {
 BadRequestException,
 Injectable,
 UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from 'bcrypt';

import { RegisterDto } from "./dto/register.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { EmailService } from "src/email/email.service";

@Injectable()
export class AuthService {

constructor(
 private prisma: PrismaService,
 private jwtService: JwtService,
 private emailService: EmailService,
) {}

// JWT TOKEN
private gerarToken(payload: any) {

 if (payload.role === 'ADMIN') {
   return this.jwtService.sign(payload, { expiresIn: '1d' });
 }

 if (payload.role === 'PUBLIC') {
   return this.jwtService.sign(payload);
 }

 return this.jwtService.sign(payload, { expiresIn: '7d' });

}


generatePublicToken() {

  const payload = {
    role: 'PUBLIC',
    system: 'site-institucional',
  };

  return {
    access_token: this.jwtService.sign(payload),
  };

}

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

    user,

    access_token: this.jwtService.sign(payload),

  };

}


// OTP TOKEN
private gerarOtp() {

 const chars =
   'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';

 let token = '';

 for (let i = 0; i < 6; i++) {

   token += chars.charAt(
     Math.floor(Math.random() * chars.length),
   );

 }

 return token;

}



// LOGIN
async login(email: string, password: string) {

 const user = await this.prisma.usuario.findUnique({
   where: { email },
 });

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

   user: {

     id: user.id,
     email: user.email,
     nome: user.nome,
     role: user.role,

   },

 };

}

private isCpf(value: string): boolean {
  const clean = value.replace(/\D/g, '');
  return clean.length === 11;
}

// REQUEST RESET
async requestPasswordReset(identifier: string) {

  let user;
  let emailToSend: string | null = null;

  const isCpf = this.isCpf(identifier);

  if (isCpf) {
  const cleanCpf = identifier.replace(/\D/g, '');

  user = await this.prisma.usuario.findFirst({
    where: { cpf: cleanCpf }
  });

  if (!user) {
    return { message: 'Se o usuário existir, você receberá as instruções.' };
  }

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  if (user.email && isValidEmail(user.email) && !user.email.includes('@autocreate.local')) {
    emailToSend = user.email;
  } else {

    const formattedCpf = cleanCpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
    
    const baseUrl = process.env.MOBUSS_INTERNAL_URL;
    const response = await fetch(
  `${baseUrl}/integracoes/mobuss/cliente`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpfCnpj: formattedCpf }),
  },
);
    if (!response.ok) {
      return { message: 'Se o usuário existir, você receberá as instruções.' };
    }

    const data = await response.json();

    emailToSend = data?.email;

    if (!emailToSend) {
      return { message: 'Se o usuário existir, você receberá as instruções.' };
    }
  }
}

  const token = this.gerarOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await this.prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      used: false,
    },
  });

  if (!emailToSend) {
  return {
    message: 'Se o usuário existir, você receberá as instruções.',
  };
}

  await this.emailService.enviar({
    para: emailToSend,
    assunto: 'Recuperação de senha',
    template: 'password-reset',
    variaveis: { token },
  });

  return {
    message: 'Se o usuário existir, você receberá as instruções.',
  };
}

// CONFIRM RESET
async confirmPasswordReset(
  identifier: string,
  token: string,
  novaSenha: string,
) {

  const isCpf = this.isCpf(identifier);

  let user;

  if (isCpf) {
    const cleanCpf = identifier.replace(/\D/g, '');
    user = await this.prisma.usuario.findFirst({
      where: { cpf: cleanCpf }
    });
  } else {
    user = await this.prisma.usuario.findUnique({
      where: { email: identifier }
    });
  }

  if (!user) {
    throw new BadRequestException('Token inválido ou expirado');
  }

  const reset = await this.prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      token,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!reset) {
    throw new BadRequestException('Token inválido ou expirado');
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await this.prisma.usuario.update({
    where: { id: user.id },
    data: { password: senhaHash },
  });

  await this.prisma.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  });

  return {
    message: 'Senha alterada com sucesso',
  };
}

// LOGIN via CPF + birthDate
async loginByCpf(cpf: string, birthDate: string) {

  const cleanCpf = cpf.replace(/\D/g, '');

  // try local DB first
  const user = await this.prisma.usuario.findFirst({
    where: { cpf: cleanCpf },
  });

  if (user) {
    if (!user.active) throw new UnauthorizedException();
    // compare birthDate stored (string) with provided
    if (!user.birthDate || user.birthDate !== birthDate) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.gerarToken(payload),
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      },
    };
  }

  // not found locally -> query external API
 const apiUrl = 'https://api.sienge.com.br';
 const apiToken = 'dmNhLXRlY2g6OHc3V0tIRDZpOEExNWpGY1RqN2xkR0JIZ3pzWWdsVTU=';


  if (!apiUrl || !apiToken) {
    throw new BadRequestException('API externa não configurada');
  }

  // attempt fetch
  const url = `${apiUrl.replace(/\/$/, '')}/vca/public/api/v1/customers?cpf=${cleanCpf}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new BadRequestException('Erro ao consultar API externa');
  }

  const data = await res.json();

  const result = data?.results?.[0];

  if (!result) {
    throw new UnauthorizedException();
  }

  // normalize API birthDate to YYYY-MM-DD if needed
  let apiBirth = result.birthDate;
  if (apiBirth && apiBirth.indexOf('T') !== -1) {
    apiBirth = apiBirth.split('T')[0];
  }

  if (result.cpf !== cleanCpf || apiBirth !== birthDate) {
    throw new UnauthorizedException();
  }

  // create local user record (first access)
  const randomPass = Math.random().toString(36).slice(2);
  const hashed = await bcrypt.hash(randomPass, 10);

  // ensure unique email placeholder
  let email = `${cleanCpf}@autocreate.local`;
  let suffix = 0;
  while (await this.prisma.usuario.findUnique({ where: { email } })) {
    suffix++;
    email = `${cleanCpf}+${suffix}@autocreate.local`;
  }

  const newUser = await this.prisma.usuario.create({
    data: {
      email,
      password: hashed,
      nome: result.name ?? null,
      cpf: cleanCpf,
      birthDate: apiBirth,
      role: 'USER',
      active: true,
    },
  });

  const payload = {
    sub: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  return {
    access_token: this.gerarToken(payload),
    user: {
      id: newUser.id,
      email: newUser.email,
      nome: newUser.nome,
      role: newUser.role,
    },
  };

}


async checkCpfAndCreate(cpf: string) {
 const cleanCpf = cpf.replace(/\D/g, '');

 let user = await this.prisma.usuario.findUnique({
   where: {
     email: cleanCpf
   }
 });

 if (user) {
   return {
     exists: true
   };
 }

 // consulta API externa
 const apiUrl = 'https://api.sienge.com.br';
 const apiToken = 'dmNhLXRlY2g6OHc3V0tIRDZpOEExNWpGY1RqN2xkR0JIZ3pzWWdsVTU=';
 const url = `${apiUrl}/vca/public/api/v1/customers?cpf=${cleanCpf}`;

 const res = await fetch(url, {
   headers: {
     Authorization: `Basic ${apiToken}`
   }
 });

 const data = await res.json();
 const result = data.results[0];
 console.log(result);
 if (!result)
   throw new UnauthorizedException();

 let birthDate = result.birthDate;

 if (birthDate.includes('T'))
   birthDate = birthDate.split('T')[0];

 const hashedPassword = await bcrypt.hash(birthDate, 10);

 user = await this.prisma.usuario.create({
   data: {
     email: cleanCpf,
     password: hashedPassword,
     nome: result.name,
     cpf: cleanCpf,
     birthDate,
     role: 'USER',
     active: true
   }
 });


 return {
   exists: false
 };
}


}