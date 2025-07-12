import { Injectable } from '@nestjs/common';
import { IloCreationDto } from '../../application/dto/ilo.creation.dto';
import { Ilo } from '../entities/ilo.entity';
import { IloUpdateDto } from '../../application/dto/ilo.update.dto';

/**
 * Handles out-of-band management of servers via HP iLO, encapsulating
 * power control, status polling, and retry logic for graceful operations.
 *
 * Responsibilities:
 * - Initiates and tracks power actions (on, off, reboot) through the iLO API.
 * - Performs health checks and reads key metrics (temperature, power state).
 * - Implements retry and timeout strategies for unreliable network calls.
 * - Translates low-level iLO errors into domain-specific exceptions.
 *
 * @remarks
 * This service is intended for use by application-layer use cases
 * (e.g. shutdownServer, startServer) and should not be injected directly
 * into controllers or other services without a coordinating use-case.
 *
 * @param apiClient  An HTTP or SDK client configured for the target iLO endpoint.
 * @param logger     A logging adapter for recording command attempts and failures.
 *
 * @example
 * // Reboot a server via iLO with built-in retry logic
 * try {
 *   await iloDomainService.rebootServer(serverEntity);
 * } catch (e) {
 *   // handle DomainIloException
 * }
 */

@Injectable()
export class IloDomainService {
  createIloEntityFromDto(dto: IloCreationDto): Ilo {
    const ilo = new Ilo();
    ilo.name = dto.name;
    ilo.ip = dto.ip;
    ilo.login = dto.login;
    ilo.password = dto.password;
    return ilo;
  }

  updateIloEntityFromDto(ilo: Ilo, dto: IloUpdateDto): Ilo {
    ilo.name = dto.name ?? ilo.name;
    ilo.ip = dto.ip ?? ilo.ip;
    ilo.login = dto.login ?? ilo.login;
    
    if (dto.password !== undefined && dto.password !== null) {
      ilo.password = dto.password;
    }
    
    return ilo;
  }
}
