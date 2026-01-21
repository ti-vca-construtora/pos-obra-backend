import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
@Roles('ADMIN')
@Get()
findAll(){
    return 'Somente ADMIN';
}

@Roles('ADMIN','USER')
@Get('me')
getProfile(){
    return 'admin ou user';
}

}
