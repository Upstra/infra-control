import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerWithVmsResponseDto } from '../dto/server-with-vms.response.dto';

/**
 * Use case for retrieving servers with their associated VMs
 *
 * @description
 * This use case fetches all servers along with their VMs in a single query,
 * providing a lightweight representation optimized for frontend list displays.
 *
 * @responsibilities
 * - Fetches servers with their VMs from the repository
 * - Maps server entities to lightweight DTOs
 * - Ensures optimal performance by loading only essential data
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const serversWithVms = await getServersWithVmsUseCase.execute();
 * console.log(serversWithVms[0].vms.length); // Number of VMs for first server
 * ```
 */
@Injectable()
export class GetServersWithVmsUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  /**
   * Executes the use case to retrieve servers with their VMs
   *
   * @returns Promise<ServerWithVmsResponseDto[]> Array of servers with their VMs
   *
   * @throws {Error} If repository operation fails
   *
   * @example
   * ```typescript
   * const result = await this.getServersWithVmsUseCase.execute();
   * // Result: [
   * //   {
   * //     id: "cce1b685-e2bf-4954-9b50-7253797ee8af",
   * //     name: "ESXi-Server-01",
   * //     ip: "192.168.1.10",
   * //     hostMoid: "host-123",
   * //     vms: [
   * //       { id: "vm-1", name: "VM-Server1-01", state: "running" },
   * //       { id: "vm-2", name: "VM-Server1-02", state: "running" }
   * //     ]
   * //   }
   * // ]
   * ```
   */
  async execute(): Promise<ServerWithVmsResponseDto[]> {
    // Fetch servers with their VMs using a single query with join
    const servers = await this.serverRepository.findAllWithVms();

    // Map each server entity to the response DTO
    return servers.map((server) => ServerWithVmsResponseDto.fromEntity(server));
  }
}
