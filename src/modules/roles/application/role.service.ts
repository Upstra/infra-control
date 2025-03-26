import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryInterface } from '../domain/interfaces/role.repository.interface';

@Injectable()
export class RoleService {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  create() {
    return this.roleRepository.hello();
  }
}
