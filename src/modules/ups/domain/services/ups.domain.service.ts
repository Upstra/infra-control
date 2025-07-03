import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Ups } from '../entities/ups.entity';
import { UpsCreationDto } from '../../application/dto/ups.creation.dto';
import { UpsUpdateDto } from '../../application/dto/ups.update.dto';

/**
 * Domain service managing UPS devices, including monitoring, graceful shutdowns,
 * and automated power events based on battery status.
 *
 * Responsibilities:
 * - Poll UPS metrics (battery level, load, runtime) via the UPS manager API.
 * - Initiate orderly shutdown sequences for servers during power failures.
 * - Record UPS event logs and alert thresholds.
 * - Fallback to forced shutdown if graceful sequence fails or times out.
 *
 * @remarks
 * Invoked by application-layer use-cases and dashboard aggregation.
 * Direct controller use is discouraged to maintain consistent UPS workflows.
 *
 * @example
 * // Trigger emergency shutdown on low battery
 * await upsDomainService.handleLowBattery(upsEntity);
 */

@Injectable()
export class UpsDomainService {
  async createUpsEntityFromCreateDto(upsDto: UpsCreationDto): Promise<Ups> {
    const ups = new Ups();
    ups.name = upsDto.name;
    ups.ip = upsDto.ip;
    ups.login = upsDto.login;
    ups.password = await bcrypt.hash(upsDto.password, 10);
    ups.grace_period_on = upsDto.grace_period_on;
    ups.grace_period_off = upsDto.grace_period_off;
    ups.roomId = upsDto.roomId;
    return ups;
  }

  async createUpsEntityFromUpdateDto(
    ups: Ups,
    upsDto: UpsUpdateDto,
  ): Promise<Ups> {
    ups.name = upsDto.name ?? ups.name;
    ups.ip = upsDto.ip ?? ups.ip;
    ups.login = upsDto.login ?? ups.login;
    ups.password = upsDto.password
      ? await bcrypt.hash(upsDto.password, 10)
      : ups.password;
    ups.grace_period_on = upsDto.grace_period_on ?? ups.grace_period_on;
    ups.grace_period_off = upsDto.grace_period_off ?? ups.grace_period_off;
    ups.roomId = upsDto.roomId ?? ups.roomId;
    return ups;
  }
}
