import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { plainToInstance } from 'class-transformer';
import { apiResponse } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const userDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
    return apiResponse(userDto, 'User created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    const usersDto = plainToInstance(ResponseUserDto, users, {
      excludeExtraneousValues: true,
    });
    return apiResponse(usersDto, 'Users retrieved successfully');
  }

  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    const userDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
    return apiResponse(userDto, 'User retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    const userDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
    return apiResponse(userDto, 'User updated successfully');
  }

  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.usersService.remove(id);
    return apiResponse(null, message);
  }
}
