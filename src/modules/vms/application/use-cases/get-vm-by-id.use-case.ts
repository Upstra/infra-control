import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';

@Injectable()
export class GetVmByIdUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<VmResponseDto> {
    const vm = await this.repo.findVmById(id);
    return new VmResponseDto(vm);
  }
}
