import { Module } from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service';
import { EmergencyContactsController } from './emergency-contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyContact]), UsersModule],
  controllers: [EmergencyContactsController],
  providers: [EmergencyContactsService],
  exports: [EmergencyContactsService],
})
export class EmergencyContactsModule {}
