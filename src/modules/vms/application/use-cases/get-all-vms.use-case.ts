import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmRetrievalException } from '../../domain/exceptions/vm.exception';

@Injectable()
export class GetAllVmsUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(): Promise<VmResponseDto[]> {
    try {
      const vms = await this.repo.findAll();
      return vms.map((vm) => new VmResponseDto(vm));
    } catch (error) {
      if (error instanceof VmRetrievalException) {
        throw error;
      }
      throw new VmRetrievalException();
    }
  }
}
