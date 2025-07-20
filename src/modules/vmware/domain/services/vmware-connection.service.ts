import { Injectable } from '@nestjs/common';
import { VmwareConnectionDto } from '../../application/dto/vmware-connection.dto';
import { Server } from '@/modules/servers/domain/entities/server.entity';

@Injectable()
export class VmwareConnectionService {
  /**
   * Creates a VMware connection DTO from a server entity
   */
  buildVmwareConnection(server: Server): VmwareConnectionDto {
    return {
      host: server.ip,
      user: server.login,
      password: server.password,
      port: 443,
    };
  }

  /**
   * Validates if a server can be used for VMware connection
   */
  isVmwareServer(server: Server): boolean {
    return server.type === 'vcenter' || server.type === 'esxi';
  }

  /**
   * Validates connection parameters
   */
  validateConnection(connection: VmwareConnectionDto): boolean {
    return !!(
      connection.host &&
      connection.user &&
      connection.password &&
      connection.port
    );
  }
}
