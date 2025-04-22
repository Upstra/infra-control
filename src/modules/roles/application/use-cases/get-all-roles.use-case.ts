import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}
  async execute(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.findAll();
    return roles.map((r) => new RoleResponseDto(r));
  }
}
