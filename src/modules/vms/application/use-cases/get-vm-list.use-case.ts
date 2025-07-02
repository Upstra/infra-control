import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmListResponseDto } from '../dto/vm.list.response.dto';

@Injectable()
export class GetVmListUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(page = 1, limit = 10): Promise<VmListResponseDto> {
    const [vms, total] = await this.repo.paginate(page, limit);
    const items = vms.map((v) => new VmResponseDto(v));
    return new VmListResponseDto(items, total, page, limit);
  }
}
