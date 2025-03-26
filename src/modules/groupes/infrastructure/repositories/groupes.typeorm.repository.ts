import { Injectable } from '@nestjs/common';
import { GroupeRepositoryInterface } from '../../domain/interfaces/groupe.repository.interface';

@Injectable()
export class GroupeTypeormRepository implements GroupeRepositoryInterface {
  hello(): string {
    return 'Hello from Groupe Repository';
  }
}
