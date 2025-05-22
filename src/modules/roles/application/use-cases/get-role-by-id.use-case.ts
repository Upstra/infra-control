import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
    return new RoleResponseDto(role);
  }
}
