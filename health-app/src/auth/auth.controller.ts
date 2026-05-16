import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { apiResponse } from '@/common/helpers/response.helper';
import type { IRequest } from '@/common/interfaces/request.interface';
import { plainToInstance } from 'class-transformer';
import { ResponseUserDto } from '@/users/dto/response-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() registerUserDto: CreateUserDto) {
    const { accessToken, refreshToken, user } =
      await this.authService.registerUser(registerUserDto);
    const userResponseDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });

    return apiResponse(
      {
        accessToken,
        refreshToken,
        user: userResponseDto,
      },
      'Successful registration',
    );
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: IRequest) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    const userResponseDto = plainToInstance(ResponseUserDto, req.user, {
      excludeExtraneousValues: true,
    });

    return apiResponse(
      {
        accessToken,
        refreshToken,
        user: userResponseDto,
      },
      'Successful login',
    );
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const { accessToken, user } =
      await this.authService.refreshToken(refreshToken);
    const userResponseDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });

    return apiResponse(
      {
        accessToken,
        user: userResponseDto,
      },
      'Refresh token successful',
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: IRequest) {
    const resultMessage = await this.authService.logout(req);
    return apiResponse(null, resultMessage);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('email is required');

    const responseMessage = await this.authService.requestPasswordReset(email);
    return apiResponse(null, responseMessage);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const responseMessage =
      await this.authService.resetPassword(resetPasswordDto);
    return apiResponse(null, responseMessage);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: IRequest) {
    const user = await this.authService.getMe(req);
    const userResponseDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });

    return apiResponse(userResponseDto, 'User data retrieved successfully');
  }
}
