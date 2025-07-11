import { ApiProperty } from '@nestjs/swagger';

export enum IloServerStatus {
  ON = 'ON',
  OFF = 'OFF',
  ERROR = 'Error',
}

export class IloStatusResponseDto {
  @ApiProperty({ enum: IloServerStatus, description: 'Current server status' })
  status: IloServerStatus;

  @ApiProperty({ description: 'Server IP address' })
  ip: string;
}

export class IloPowerResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Operation message' })
  message: string;

  @ApiProperty({ enum: IloServerStatus, description: 'Current server status after operation' })
  currentStatus: IloServerStatus;
}