import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findRoleById(id);
    if (!role) throw new NotFoundException('Role not found');
    return new RoleResponseDto(role);
  }
}
