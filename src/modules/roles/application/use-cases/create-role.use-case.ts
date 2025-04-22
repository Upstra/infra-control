import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto, RoleResponseDto } from '../dto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(dto: RoleCreationDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.createRole(dto.name);
    return new RoleResponseDto(role);
  }
}
