import { Injectable, NotFoundException } from '@nestjs/common';
import { PythonExecutorService } from '@/core/services/python-executor';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';

interface VmInfo {
  moid: string;
  name: string;
  host?: {
    moid: string;
    name: string;
  };
}

@Injectable()
export class GetServerByVmMoidUseCase {
  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(
    vmMoid: string,
    connection: VmwareConnectionDto,
  ): Promise<Server> {
    const vms = await this.listVmsForServer(connection);
    
    const targetVm = vms.find((vm) => vm.moid === vmMoid);
    if (!targetVm) {
      throw new NotFoundException(`VM with MOID ${vmMoid} not found`);
    }

    const server = await this.serverRepository.findOne({
      where: { ip: connection.host },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with IP ${connection.host} not found in database`,
      );
    }

    return server;
  }

  private async listVmsForServer(
    connection: VmwareConnectionDto,
  ): Promise<VmInfo[]> {
    const args = [
      '--ip',
      connection.host,
      '--user',
      connection.user,
      '--password',
      connection.password,
    ];

    if (connection.port) {
      args.push('--port', connection.port.toString());
    }

    try {
      const result = await this.pythonExecutor.executePython('list_vm.py', args);
      
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format from list_vm.py');
      }

      return result as VmInfo[];
    } catch (error) {
      if (error.message?.includes('401')) {
        throw new NotFoundException('Invalid VMware credentials');
      }
      throw error;
    }
  }
}