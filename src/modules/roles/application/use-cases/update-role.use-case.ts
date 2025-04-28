import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto } from '../dto/role.creation.dto';
import { RoleResponseDto } from '../dto/role.response.dto';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(id: string, dto: RoleCreationDto): Promise<RoleResponseDto> {
    const updated = await this.roleRepository.updateRole(id, dto.name);
    return new RoleResponseDto(updated);
  }
}
