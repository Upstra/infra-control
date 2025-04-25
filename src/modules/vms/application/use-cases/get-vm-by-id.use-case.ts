import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmNotFoundException } from '../../domain/exceptions/vm.exception';

@Injectable()
export class GetVmByIdUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<VmResponseDto> {
    try {
      const vm = await this.repo.findVmById(id);
      return new VmResponseDto(vm);
    } catch {
      throw new VmNotFoundException(id);
    }
  }
}
