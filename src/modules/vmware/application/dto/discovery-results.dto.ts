import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscoveredVmDto } from './discovered-vm.dto';

export class ServerDiscoveryResult {
  @IsString()
  serverId: string;

  @IsString()
  serverName: string;

  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsNumber()
  vmCount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredVmDto)
  vms: DiscoveredVmDto[];
}

export class DiscoveryResultsDto {
  @IsNumber()
  totalVmsDiscovered: number;

  @IsNumber()
  totalServersProcessed: number;

  @IsNumber()
  successfulServers: number;

  @IsNumber()
  failedServers: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerDiscoveryResult)
  serverResults: ServerDiscoveryResult[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredVmDto)
  allDiscoveredVms: DiscoveredVmDto[];
}
