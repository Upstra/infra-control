import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmDomainService } from '../../vm.domain.service';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmCreationException } from '../../domain/exceptions/vm.exception';

@Injectable()
export class CreateVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
    private readonly domain: VmDomainService,
  ) {}

  async execute(dto: VmCreationDto): Promise<VmResponseDto> {
    try {
      const entity = this.domain.createVmEntity(dto);
      const vm = await this.repo.save(entity);
      return new VmResponseDto(vm);
    } catch {
      throw new VmCreationException();
    }
  }
}
