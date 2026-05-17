import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { IRequest } from '@/common/interfaces/request.interface';
import { withTransaction } from '../common/helpers/transaction.helper';
import { assertValidExpires } from '@/common/utils/assertValidExpires';
import { EmailService } from '@/email/email.service';
import { render } from '@react-email/render';
import ResetPasswordOtpEmailTemplate from '@/email/templates/resetPasswordOtp';
import { ConfirmVerificationCodeDto } from './dto/confirm-verification-code.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async registerUser(registerUserDto: CreateUserDto, manager?: EntityManager) {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        if (registerUserDto.password) {
          const hashedPassword = await bcrypt.hash(
            registerUserDto.password,
            10,
          );
          registerUserDto.password = hashedPassword;
        }

        const createdUser = await this.userService.create(
          registerUserDto,
          manager,
        );

        const accessToken = this.generateAccessToken(createdUser);
        const refreshToken = this.generateRefreshToken(createdUser);

        const authRegister = manager.create(Auth, {
          accessToken,
          user: createdUser,
          refreshToken,
        });

        await manager.save(authRegister);

        return { accessToken, refreshToken, user: createdUser };
      },
      manager,
    );
  }

  async login(user: User) {
    return withTransaction(this.dataSource, async (manager) => {
      let authRegister = await this.authRepository.findOneBy({
        user: { email: user.email },
      });

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      if (authRegister) {
        authRegister.accessToken = accessToken;
        authRegister.refreshToken = refreshToken;
        authRegister = await manager.save(authRegister);
      } else {
        const newAuthEntity = manager.create(Auth, {
          accessToken,
          user,
          refreshToken,
        });
        authRegister = await manager.save(newAuthEntity);
      }

      return {
        accessToken,
        refreshToken,
      };
    });
  }

  async logout(req: IRequest): Promise<string> {
    const user = req.user;

    if (user) {
      const authFound = await this.authRepository.findOneBy({
        user: { id: user.id },
      });

      if (authFound) {
        await this.authRepository.remove(authFound);
      }

      return 'User logged out successfully';
    }

    throw new BadRequestException('User not authenticated');
  }

  async validateUser(email: string, pass: string): Promise<Partial<User>> {
    const userFound = await this.userService.findByEmail(email, true);

    const isMatch = await bcrypt.compare(pass, userFound.password);
    if (!isMatch) {
      throw new UnauthorizedException('User credentials invalid');
    }
    const { password: _p, ...userData } = userFound;
    return userData;
  }

  async refreshToken(refreshToken: string) {
    const authFound = await this.authRepository.findOne({
      where: { refreshToken },
      relations: ['user'],
    });

    if (!authFound) {
      throw new NotFoundException('Invalid refresh token');
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.generateAccessToken(authFound.user);
    authFound.accessToken = accessToken;
    const authUpdated = await this.authRepository.save(authFound);

    const { password: _pass, ...dataUser } = authUpdated.user;
    return {
      accessToken,
      user: dataUser,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      username: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(user: User) {
    const payload = {
      username: user.email,
      sub: user.id,
    };

    const expiresIn = process.env.JWT_REFRESH_EXPIRATION ?? '1d';
    assertValidExpires(expiresIn);

    return this.jwtService.sign(payload, {
      expiresIn,
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }

  async getMe(req: IRequest) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return await this.userService.findOne(user.id);
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let authRecord = await this.authRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (authRecord) {
      authRecord.verificationCode = verificationCode;
      authRecord.verificationCodeExpiry = verificationCodeExpiry;
      await this.authRepository.save(authRecord);
    } else {
      authRecord = this.authRepository.create({
        user,
        accessToken: '',
        refreshToken: '',
        verificationCode,
        verificationCodeExpiry,
      });
      await this.authRepository.save(authRecord);
    }

    try {
      const otpTemplate = await render(
        ResetPasswordOtpEmailTemplate({
          verificationCode,
          userName: user.firstName,
        }),
      );
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Código de verificación - Restablecer contraseña',
        html: otpTemplate,
      });

      return 'Verification code sent to email';
    } catch (_error) {
      throw new BadRequestException('Failed to send verification code email');
    }
  }

  async verifyAndResetPassword(dto: ConfirmVerificationCodeDto) {
    const { email, newPassword, verificationCode } = dto;

    const user = await this.userService.findByEmail(email);

    const authRecord = await this.authRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!authRecord?.verificationCode || !authRecord?.verificationCodeExpiry) {
      throw new BadRequestException(
        'No verification code found. Please request a new one.',
      );
    }

    if (authRecord.verificationCode !== verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > authRecord.verificationCodeExpiry) {
      throw new BadRequestException('Verification code has expired');
    }

    return withTransaction(this.dataSource, async (manager) => {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await manager.update(User, { id: user.id }, { password: hashedPassword });
      await manager.update(
        Auth,
        { id: authRecord.id },
        {
          verificationCode: null,
          verificationCodeExpiry: null,
        },
      );
      return 'Password updated successfully';
    });
  }
}
