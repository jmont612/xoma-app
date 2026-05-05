import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from '../entities/auth.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private userService: UsersService,
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<User> {
    const user = await this.userService.findOne(payload.sub);
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const accessToken = authHeader.replace('Bearer ', '');

    const tokenExists = await this.authRepository.findOneBy({
      accessToken,
      user: { id: payload.sub },
    });

    if (!tokenExists) {
      throw new UnauthorizedException('Access token not registered');
    }
    return user;
  }
}
