import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto, RoleResponseDto } from '../dto';
import { AdminRoleCreationDto } from '../dto/role.creation.dto';
import { RoleDomainService } from '../../domain/services/role.domain.service';
import { AdminRoleAlreadyExistsException } from '../../domain/exceptions/role.exception';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly roleDomainService: RoleDomainService,
  ) {}

  async execute(
    dto: RoleCreationDto | AdminRoleCreationDto,
  ): Promise<RoleResponseDto> {
    if (dto instanceof AdminRoleCreationDto && dto.isAdmin) {
      const existing = await this.roleRepository.findOneByField({
        field: 'isAdmin',
        value: true,
        disableThrow: true,
      });
      if (existing) {
        throw new AdminRoleAlreadyExistsException();
      }
    }
    const entity = this.roleDomainService.toRoleEntity(dto);
    const role = await this.roleRepository.save(entity);
    return new RoleResponseDto(role);
  }
}
