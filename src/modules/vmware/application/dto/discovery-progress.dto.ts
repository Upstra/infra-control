import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum DiscoveryStatus {
  STARTING = 'starting',
  DISCOVERING = 'discovering',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

export class DiscoveryProgressDto {
  @IsEnum(DiscoveryStatus)
  status: DiscoveryStatus;

  @IsOptional()
  @IsString()
  currentServer?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serversProcessed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalServers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discoveredVms?: number;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  timestamp?: Date;
}
