import {
 BadRequestException,
 Injectable,
 UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { EmailService } from 'src/email/email.service';

import * as bcrypt from 'bcrypt';

import { RegisterDto } from "./dto/register.dto";

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



// REQUEST RESET
async requestPasswordReset(email: string) {

 const usuario = await this.prisma.usuario.findUnique({

   where: { email },

 });

 if (!usuario) {

   return {

     message:
       'Se o email existir, você receberá as instruções.',

   };

 }

 const token = this.gerarOtp();

 const expiresAt =
   new Date(Date.now() + 10 * 60 * 1000);


 await this.prisma.passwordReset.create({
   data: {
     email,
     token,
     expiresAt,
     used: false,
   },
 });
 await this.emailService.enviar({
   para: email,
   assunto: 'Recuperação de senha',
   template: 'password-reset',
   variaveis: {
     token,
   },
 });

 return {
   message: 'Código enviado',
 };
}

// CONFIRM RESET
async confirmPasswordReset(
 email: string,
 token: string,
 novaSenha: string,
) {

 const reset =
   await this.prisma.passwordReset.findFirst({

   where: {

     email,
     token,
     used: false,

     expiresAt: {

       gt: new Date(),

     },

   },

 });

 if (!reset) {

   throw new BadRequestException(
     'Token inválido ou expirado',
   );

 }


 const senhaHash =
   await bcrypt.hash(novaSenha, 10);


 await this.prisma.usuario.update({

   where: { email },

   data: {

     password: senhaHash,

   },

 });


 await this.prisma.passwordReset.update({

   where: { id: reset.id },

   data: {

     used: true,

   },

 });

 return {

   message: 'Senha alterada com sucesso',

 };

}


}