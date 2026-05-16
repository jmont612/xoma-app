import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { AuthRegisterHelper } from '@/common/helpers/auth-register-helper';
import { assertValidExpires } from '@/common/utils/assertValidExpires';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtExpiration = configService.get<string>('JWT_EXPIRATION');
        assertValidExpires(jwtExpiration!);
        const jwtSecret = configService.get<string>('JWT_SECRET');
        return {
          secret: jwtSecret ?? 'fallback-secret',
          signOptions: {
            expiresIn: jwtExpiration ?? '15m',
          },
        };
      },
    }),
    PassportModule,
    UsersModule,
    EmailModule,
    TypeOrmModule.forFeature([Auth]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    LocalAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    AuthRegisterHelper,
  ],
})
export class AuthModule {}
