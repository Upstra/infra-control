import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { IpValidationRequestDto, IpValidationResponseDto } from '../dto/ip-validation.dto';

@Injectable()
export class ValidateIpUseCase {
  private readonly logger = new Logger(ValidateIpUseCase.name);

  constructor(
    @InjectRepository(Ups)
    private readonly upsRepository: Repository<Ups>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Ilo)
    private readonly iloRepository: Repository<Ilo>,
  ) {}

  async execute(dto: IpValidationRequestDto): Promise<IpValidationResponseDto> {
    if (!dto.ip?.trim()) {
      return { exists: false };
    }

    this.logger.debug(`Validating IP availability: ${dto.ip} for ${dto.resourceType}`);

    const trimmedIp = dto.ip.trim();
    const whereCondition = dto.excludeId 
      ? { ip: trimmedIp, id: Not(dto.excludeId) }
      : { ip: trimmedIp };

    let conflictingResource: any = null;
    let resourceType = '';

    switch (dto.resourceType) {
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
      case 'ilo':
        conflictingResource = await this.iloRepository.findOne({
          where: whereCondition,
          select: ['id', 'name'],
        });
        resourceType = 'iLO';
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
  async validateIp(ip: string): Promise<IpValidationResponseDto> {
    return this.execute({ ip, resourceType: 'server' });
  }
}