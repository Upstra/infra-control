import { IsString, IsOptional, IsNumber } from 'class-validator';

export class DiscoveredVmDto {
  @IsString()
  moid: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  guestOs?: string;

  @IsOptional()
  @IsString()
  powerState?: string;

  @IsOptional()
  @IsNumber()
  memoryMB?: number;

  @IsOptional()
  @IsNumber()
  numCpu?: number;

  @IsString()
  serverId: string;

  @IsString()
  serverName: string;
}
