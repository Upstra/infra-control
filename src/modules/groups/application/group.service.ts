import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../domain/interfaces/group.repository.interface';

@Injectable()
export class GroupService {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  create() {
    return this.groupRepository.hello();
  }
}
