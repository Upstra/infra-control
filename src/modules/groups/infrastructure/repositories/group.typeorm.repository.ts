import { Injectable } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';

@Injectable()
export class GroupTypeormRepository implements GroupRepositoryInterface {
  hello(): string {
    return 'Hello from Group Repository';
  }
}
