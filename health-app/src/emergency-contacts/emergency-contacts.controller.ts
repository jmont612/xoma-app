import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { apiResponse } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

@Controller('emergency-contacts')
@UseGuards(JwtAuthGuard)
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Post()
  async create(@Body() createEmergencyContactDto: CreateEmergencyContactDto) {
    const contact = await this.emergencyContactsService.create(
      createEmergencyContactDto,
    );
    return apiResponse(contact, 'Emergency contact created successfully');
  }

  @Get()
  async findAll() {
    const contacts = await this.emergencyContactsService.findAll();
    return apiResponse(contacts, 'Emergency contacts retrieved successfully');
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const contacts = await this.emergencyContactsService.findByUserId(userId);
    return apiResponse(
      contacts,
      'User emergency contacts retrieved successfully',
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const contact = await this.emergencyContactsService.findOne(id);
    return apiResponse(contact, 'Emergency contact retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmergencyContactDto: UpdateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.update(
      id,
      updateEmergencyContactDto,
    );
    return apiResponse(contact, 'Emergency contact updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emergencyContactsService.remove(id);
    return apiResponse(null, message);
  }
}
