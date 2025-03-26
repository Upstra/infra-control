import { Injectable } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';

@Injectable()
export class IloTypeormRepository implements IloRepositoryInterface {
  hello(): string {
    return 'Hello from Ilo Repository';
  }
}
