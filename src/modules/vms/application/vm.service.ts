import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../domain/interfaces/vm.repository.interface';

@Injectable()
export class VmService {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
  ) {}

  create() {
    return this.vmRepository.hello();
  }
}
