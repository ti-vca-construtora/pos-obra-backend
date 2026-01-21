import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
constructor(private readonly usersService: UsersService) {}

@Roles('ADMIN')
@Get()
findAll(){
    return 'Somente ADMIN';
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

@Roles('ADMIN','USER')
@Get('me')
getProfile(){
    return 'admin ou user';
}

}
