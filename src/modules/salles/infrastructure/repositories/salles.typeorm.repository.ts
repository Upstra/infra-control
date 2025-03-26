import { Injectable } from '@nestjs/common';
import { SalleRepositoryInterface } from '../../domain/interfaces/salle.repository.interface';
@Injectable()
export class SalleTypeormRepository implements SalleRepositoryInterface {
  hello(): string {
    return 'Hello from Salle Repository';
  }
}
