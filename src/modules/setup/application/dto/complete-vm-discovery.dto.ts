import { ApiProperty } from '@nestjs/swagger';
import { VmDiscoveryResult } from '../types/vm-discovery-result.interface';

export class CompleteVmDiscoveryDto implements VmDiscoveryResult {
  @ApiProperty({ description: 'ID du serveur scanné' })
  serverId: string;

  @ApiProperty({ description: 'Nombre de VMs découvertes' })
  vmCount: number;

  @ApiProperty({
    description: 'Liste des IDs des VMs découvertes',
    required: false,
  })
  vmIds?: string[];
}
