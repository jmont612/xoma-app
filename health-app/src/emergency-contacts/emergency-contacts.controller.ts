import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EmergencyContactsService } from './emergency-contacts.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { SyncEmergencyContactsDto } from './dto/sync-emergency-contacts.dto';
import { apiResponse } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

@ApiTags('Emergency Contacts')
@ApiBearerAuth('access-token')
@Controller('emergency-contacts')
@UseGuards(JwtAuthGuard)
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @ApiOperation({ summary: 'Crear un contacto de emergencia' })
  @ApiResponse({ status: 201, description: 'Contacto creado exitosamente' })
  @Post()
  async create(@Body() createEmergencyContactDto: CreateEmergencyContactDto) {
    const contact = await this.emergencyContactsService.create(
      createEmergencyContactDto,
    );
    return apiResponse(contact, 'Emergency contact created successfully');
  }

  @ApiOperation({ summary: 'Obtener todos los contactos de emergencia' })
  @ApiResponse({ status: 200, description: 'Lista de contactos de emergencia' })
  @Get()
  async findAll() {
    const contacts = await this.emergencyContactsService.findAll();
    return apiResponse(contacts, 'Emergency contacts retrieved successfully');
  }

  @ApiOperation({
    summary:
      'Sincronizar contactos de emergencia de un usuario (upsert por tipo)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Contactos sincronizados: crea o actualiza por tipo de contacto',
  })
  @Put('user/:userId/sync')
  async syncByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() syncDto: SyncEmergencyContactsDto,
  ) {
    const contacts = await this.emergencyContactsService.syncByUser(
      userId,
      syncDto.contacts,
    );
    return apiResponse(contacts, 'Emergency contacts synced successfully');
  }

  @ApiOperation({ summary: 'Obtener contactos de emergencia de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de contactos del usuario' })
  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const contacts = await this.emergencyContactsService.findByUserId(userId);
    return apiResponse(
      contacts,
      'User emergency contacts retrieved successfully',
    );
  }

  @ApiOperation({ summary: 'Obtener un contacto de emergencia por ID' })
  @ApiResponse({ status: 200, description: 'Contacto encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const contact = await this.emergencyContactsService.findOne(id);
    return apiResponse(contact, 'Emergency contact retrieved successfully');
  }

  @ApiOperation({ summary: 'Actualizar un contacto de emergencia' })
  @ApiResponse({ status: 200, description: 'Contacto actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
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

  @ApiOperation({ summary: 'Eliminar un contacto de emergencia (soft delete)' })
  @ApiResponse({ status: 200, description: 'Contacto eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const message = await this.emergencyContactsService.remove(id);
    return apiResponse(null, message);
  }
}
