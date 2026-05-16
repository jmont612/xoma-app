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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { plainToInstance } from 'class-transformer';
import { apiResponse } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const userDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
    return apiResponse(userDto, 'User created successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    const usersDto = plainToInstance(ResponseUserDto, users, {
      excludeExtraneousValues: true,
    });
    return apiResponse(usersDto, 'Users retrieved successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    const userDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
    return apiResponse(userDto, 'User retrieved successfully');
  }

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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.usersService.remove(id);
    return apiResponse(null, message);
  }
}
