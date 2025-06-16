import { ApiProperty } from '@nestjs/swagger';
import { VmDiscoveryResult } from '../types/vm-discovery-result.interface';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CompleteVmDiscoveryDto implements VmDiscoveryResult {
  @ApiProperty({ description: 'ID du serveur scanné' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly serverId: string;

  @ApiProperty({ description: 'Nombre de VMs découvertes' })
  @IsNotEmpty()
  readonly vmCount: number;

  @ApiProperty({
    description: 'Liste des IDs des VMs découvertes',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  readonly vmIds?: string[];
}
