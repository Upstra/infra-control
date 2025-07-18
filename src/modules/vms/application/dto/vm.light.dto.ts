import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Vm } from '../../domain/entities/vm.entity';

/**
 * Light VM DTO with only essential fields for server-vm list endpoints
 *
 * @description
 * This DTO contains only the minimal necessary information about a VM
 * to optimize performance when fetching servers with their VMs.
 *
 * @since 1.0.0
 */
export class VmLightDto {
  /**
   * VM unique identifier
   *
   * @example "94c93b06-e2bf-4954-9b50-7253797ee8af"
   */
  @ApiProperty({
    description: 'VM unique identifier',
    example: '94c93b06-e2bf-4954-9b50-7253797ee8af',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  /**
   * VM name
   *
   * @example "VM-Server1-01"
   */
  @ApiProperty({
    description: 'VM name',
    example: 'VM-Server1-01',
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  /**
   * VM current state
   *
   * @example "running"
   */
  @ApiProperty({
    description: 'VM current state',
    example: 'running',
    enum: ['running', 'stopped', 'suspended', 'poweredOff', 'poweredOn'],
  })
  @IsNotEmpty()
  @IsString()
  readonly state: string;

  /**
   * Creates a new VmLightDto instance from a VM entity
   *
   * @param vm - The VM entity to convert
   */
  constructor(vm: Vm) {
    this.id = vm.id;
    this.name = vm.name;
    this.state = vm.state;
  }

  /**
   * Static factory method to create VmLightDto from VM entity
   *
   * @param vm - The VM entity to convert
   * @returns VmLightDto instance
   */
  static fromEntity(vm: Vm): VmLightDto {
    return new VmLightDto(vm);
  }
}
