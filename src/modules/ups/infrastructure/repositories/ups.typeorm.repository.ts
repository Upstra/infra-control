import { Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
@Injectable()
export class UpsTypeormRepository implements UpsRepositoryInterface {
  hello(): string {
    return 'Hello from Ups Repository';
  }
}
