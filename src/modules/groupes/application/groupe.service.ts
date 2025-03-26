import { Injectable, Inject } from '@nestjs/common';
import { GroupeRepositoryInterface } from '../domain/interfaces/groupe.repository.interface';

@Injectable()
export class GroupeService {
  constructor(
    @Inject('GroupeRepositoryInterface')
    private readonly groupeRepository: GroupeRepositoryInterface,
  ) {}

  create() {
    return this.groupeRepository.hello();
  }
}
