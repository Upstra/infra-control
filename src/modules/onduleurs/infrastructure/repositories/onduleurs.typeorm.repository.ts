import { Injectable } from '@nestjs/common';
import { OnduleurRepositoryInterface } from '../../domain/interfaces/onduleur.repository.interface';
@Injectable()
export class OnduleurTypeormRepository implements OnduleurRepositoryInterface {
  hello(): string {
    return 'Hello from Onduleur Repository';
  }
}
