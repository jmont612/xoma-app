import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { withTransaction } from 'src/common/helpers/transaction.helper';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class EmergencyContactsService {
  constructor(
    @InjectRepository(EmergencyContact)
    private readonly emergencyContactRepository: Repository<EmergencyContact>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createEmergencyContactDto: CreateEmergencyContactDto,
    manager?: EntityManager,
  ): Promise<EmergencyContact> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const contact = manager.create(
          EmergencyContact,
          createEmergencyContactDto,
        );

        const user = await this.usersService.findOne(
          createEmergencyContactDto.userId,
        );
        contact.user = user;

        return await manager.save(contact);
      },
      manager,
    );
  }

  async findAll(): Promise<EmergencyContact[]> {
    return await this.emergencyContactRepository.find({
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<EmergencyContact[]> {
    return await this.emergencyContactRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<EmergencyContact> {
    const contact = await this.emergencyContactRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    return contact;
  }

  async update(
    id: number,
    updateEmergencyContactDto: UpdateEmergencyContactDto,
    manager?: EntityManager,
  ): Promise<EmergencyContact> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        const contact = await this.findOne(id);
        Object.assign(contact, updateEmergencyContactDto);
        return await manager.save(contact);
      },
      manager,
    );
  }

  async remove(id: number, manager?: EntityManager): Promise<string> {
    return await withTransaction(
      this.dataSource,
      async (manager) => {
        await manager.softDelete(EmergencyContact, id);
        return 'Emergency contact deleted successfully';
      },
      manager,
    );
  }
}
