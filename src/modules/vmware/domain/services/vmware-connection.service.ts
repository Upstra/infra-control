import { Injectable } from '@nestjs/common';
import { VmwareConnectionDto } from '../../application/dto/vmware-connection.dto';
import { Server } from '@/modules/servers/domain/entities/server.entity';

export function extractPortFromAdminUrl(
  adminUrl?: string,
  defaultPort = 443,
): number {
  if (!adminUrl) return defaultPort;
  try {
    const raw = adminUrl.includes('://') ? adminUrl : `https://${adminUrl}`;
    const parsed = new URL(raw);
    if (parsed.port) {
      return parseInt(parsed.port, 10);
    }
  } catch {
    // fallback to defaultPort
  }
  return defaultPort;
}

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
      port: extractPortFromAdminUrl(server.adminUrl, 443),
    };
  }

  buildConnectionArgs(connection: VmwareConnectionDto): string[] {
    const args = [
      '--ip',
      connection.host,
      '--user',
      connection.user,
      '--password',
      connection.password,
    ];
    if (connection.port && connection.port !== 443) {
      args.push('--port', connection.port.toString());
    }
    return args;
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
