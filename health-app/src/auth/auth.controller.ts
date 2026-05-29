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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LoginDto } from './dto/login.dto';
import { ConfirmVerificationCodeDto } from './dto/confirm-verification-code.dto';
import { apiResponse } from '@/common/helpers/response.helper';
import type { IRequest } from '@/common/interfaces/request.interface';
import { plainToInstance } from 'class-transformer';
import { ResponseUserDto } from '@/users/dto/response-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email/username ya existe',
  })
  @Post('register')
  async registerUser(@Body() registerUserDto: CreateUserDto) {
    const { accessToken, refreshToken, user } =
      await this.authService.registerUser(registerUserDto);
    const userResponseDto = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });

    return apiResponse(
      { accessToken, refreshToken, user: userResponseDto },
      'Successful registration',
    );
  }

  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, retorna tokens JWT',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
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
      { accessToken, refreshToken, user: userResponseDto },
      'Successful login',
    );
  }

  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiBody({
    schema: {
      properties: { refreshToken: { type: 'string' } },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({ status: 200, description: 'Access token renovado' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
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
      { accessToken, user: userResponseDto },
      'Refresh token successful',
    );
  }

  @ApiOperation({ summary: 'Cerrar sesión e invalidar tokens' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: IRequest) {
    const resultMessage = await this.authService.logout(req);
    return apiResponse(null, resultMessage);
  }

  @ApiOperation({ summary: 'Solicitar código OTP para restablecer contraseña' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'usuario@email.com' } },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código OTP de 6 dígitos enviado al email (válido 10 min)',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('email is required');

    const responseMessage = await this.authService.requestPasswordReset(email);
    return apiResponse(null, responseMessage);
  }

  @ApiOperation({
    summary: 'Verificar código OTP y establecer nueva contraseña',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado' })
  @Post('verify-reset-code')
  async verifyResetCode(@Body() dto: ConfirmVerificationCodeDto) {
    const responseMessage = await this.authService.verifyAndResetPassword(dto);
    return apiResponse(null, responseMessage);
  }

  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
