import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Not, Repository, DataSource } from 'typeorm';
import { withTransaction } from '@/common/helpers/transaction.helper';
import * as bcrypt from 'bcrypt';
import { CreateEmergencyContactDto } from '@/emergency-contacts/dto/create-emergency-contact.dto';
import { EmergencyContact } from '@/emergency-contacts/entities/emergency-contact.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    manager?: EntityManager,
  ): Promise<User> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { email, username } = createUserDto;

        const userExist = await this.userRepository.findOne({
          where: [{ email }, { username }],
        });

        if (userExist) {
          throw new ConflictException('User already exists');
        }

        const user = manager.create(User, createUserDto);
        return await manager.save(user);
      },
      manager,
    );
  }

  async findAll(relations?: string[]): Promise<User[]> {
    return await this.userRepository.find({ relations });
  }

  async findOne(id: number, relations?: string[]): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<User> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.password');
    }

    const user = await query.getOne();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    manager?: EntityManager,
  ): Promise<User> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const { email, username, password, emergencyContacts, ...userData } =
          updateUserDto;
        const user = await this.findOne(id);

        if (email) {
          const userExistByEmail = await this.userRepository.findOne({
            where: { email, id: Not(id) },
          });
          if (userExistByEmail) {
            throw new ConflictException('Email already in use');
          }
        }

        if (emergencyContacts) {
          const emergencyContactsData: CreateEmergencyContactDto[] =
            emergencyContacts.map((contact) => ({
              ...contact,
              userId: user.id,
            }));
          await manager.save(EmergencyContact, emergencyContactsData);
        }

        Object.assign(user, userData);
        if (email) user.email = email;
        if (username) user.username = username;
        if (password) {
          user.password = await bcrypt.hash(password, 10);
        }

        return await manager.save(user);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(User, id);
        return 'User deleted successfully';
      },
      manager,
    );
  }
}
