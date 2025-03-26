import { Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';

@Injectable()
export class VmTypeormRepository implements VmRepositoryInterface {
  hello(): string {
    return 'Hello from Vm Repository';
  }
}
