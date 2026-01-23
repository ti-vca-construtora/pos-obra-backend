import { Body, Controller,Get, Post, Req,UnauthorizedException,UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import {Public} from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {Roles} from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  @Post('login')
  login(@Body() dto:LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }


@Public()
@Post('public-token')
generatePublicToken(
  @Headers('x-api-key') apiKey: string,
) {
  if (apiKey !== process.env.PUBLIC_API_KEY) {
    throw new UnauthorizedException('API Key inválida');
  }

  return this.authService.generatePublicToken();
}



@Public()
@Post('register')
register(@Body() dto:RegisterDto){
  return this.authService.register(dto)
}

// 🔐 rota protegida
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('me')
  me(@Req() req: any) {
    return {
      user: req.user,
    };
  }

}
