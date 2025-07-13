import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Room } from '@/modules/rooms/domain/entities/room.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import {
  NameValidationRequestDto,
  NameValidationResponseDto,
} from '../dto/ip-validation.dto';

@Injectable()
export class ValidateNameUseCase {
  private readonly logger = new Logger(ValidateNameUseCase.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Ups)
    private readonly upsRepository: Repository<Ups>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(
    dto: NameValidationRequestDto,
  ): Promise<NameValidationResponseDto> {
    if (!dto.name?.trim()) {
      return { exists: false };
    }

    const trimmedName = dto.name.trim();
    const whereCondition = dto.excludeId
      ? { name: trimmedName, id: Not(dto.excludeId) }
      : { name: trimmedName };

    let conflictingResource: any = null;
    let resourceType = '';

    switch (dto.resourceType) {
      case 'room':
        conflictingResource = await this.roomRepository.findOne({
          where: whereCondition,
          select: ['id', 'name'],
        });
        resourceType = 'Room';
        break;
      case 'ups':
        conflictingResource = await this.upsRepository.findOne({
          where: whereCondition,
          select: ['id', 'name'],
        });
        resourceType = 'UPS';
        break;
      case 'server':
        conflictingResource = await this.serverRepository.findOne({
          where: whereCondition,
          select: ['id', 'name'],
        });
        resourceType = 'Server';
        break;
    }

    if (conflictingResource) {
      return {
        exists: true,
        conflictsWith: `${resourceType} "${conflictingResource.name}"`,
      };
    }

    return { exists: false };
  }

  /**
   * Legacy method for backward compatibility
   */
  async validateName(
    name: string,
    type: 'ups' | 'server',
  ): Promise<NameValidationResponseDto> {
    return this.execute({ name, resourceType: type });
  }
}
