import {
  BadRequestException,
  ForbiddenException,
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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IRequest } from '@/common/interfaces/request.interface';
import { withTransaction } from '../common/helpers/transaction.helper';
import { assertValidExpires } from '@/common/utils/assertValidExpires';
import { EmailService } from '@/email/email.service';
import { render } from '@react-email/render';
import ResetPasswordEmailTemplate from '@/email/templates/resetPassword';

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

        // Generate tokens
        const accessToken = this.generateAccessToken(createdUser);
        const refreshToken = this.generateRefreshToken(createdUser);

        // Register tokens in database
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

    // Verify refresh token
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

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });

    const resetPasswordUrl = `${process.env.DOMAIN_URL}/reset-password?token=${token}`;

    try {
      const resetTemplate = await render(
        ResetPasswordEmailTemplate({
          resetPasswordUrl,
          userName: user.firstName,
        }),
      );
      const emailPayload = {
        to: user.email,
        subject: 'Restablecer contraseña',
        html: resetTemplate,
      };

      await this.emailService.sendMail(emailPayload);

      return 'Password reset email sent successfully';
    } catch (_error) {
      throw new BadRequestException('Failed to send password reset email');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    return await withTransaction(this.dataSource, async (manager) => {
      try {
        const payload = this.jwtService.verify(token);

        if (!payload) {
          throw new ForbiddenException('Invalid or expired token');
        }

        const userId: number = payload.sub;
        const user = await this.userService.findOne(userId);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await manager.update(
          User,
          { id: user.id },
          { password: hashedPassword },
        );

        return 'Password updated correctly';
      } catch (_error) {
        throw new BadRequestException('Failed to reset password');
      }
    });
  }
}
