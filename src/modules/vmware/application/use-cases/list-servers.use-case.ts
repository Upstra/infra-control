import { Injectable } from '@nestjs/common';
import { VmwareConnectionDto } from '../dto';
import { VmwareService } from '../../domain/services/vmware.service';
import { VmwareServer } from '../../domain/interfaces';

@Injectable()
export class ListServersUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(connection: VmwareConnectionDto): Promise<VmwareServer[]> {
    return this.vmwareService.listServers(connection);
  }
}
