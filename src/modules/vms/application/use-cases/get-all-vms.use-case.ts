import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';

@Injectable()
export class GetAllVmsUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(): Promise<VmResponseDto[]> {
    const vms = await this.repo.findAll();
    return vms.map((vm) => new VmResponseDto(vm));
  }
}
