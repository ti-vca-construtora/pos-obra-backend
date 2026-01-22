import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
constructor(private readonly usersService: UsersService) {}

@Roles('ADMIN')
@Get()
findAll(){
    return this.usersService.findAll();    
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.usersService.update(+id, dto);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Delete(':id')
remove(@Param('id') id: string) {
  return this.usersService.remove(+id);
}

}
