import { Injectable } from '@nestjs/common';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmMigrateDto } from '../dto';

export interface VmMigrationResult {
  success: boolean;
  message: string;
  newHost: string;
}

@Injectable()
export class MigrateVmUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(vmMoid: string, dto: VmMigrateDto): Promise<VmMigrationResult> {
    return await this.vmwareService.migrateVM(
      vmMoid,
      dto.destinationMoid,
      dto.connection,
    );
  }
}