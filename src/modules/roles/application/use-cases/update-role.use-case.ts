import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto } from '../dto/role.creation.dto';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleUpdateDto } from '../dto/role.update.dto';
import { RoleDomainService } from '../../domain/services/role.domain.service';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly roleDomainService: RoleDomainService,
  ) {}

  async execute(id: string, dto: RoleUpdateDto): Promise<RoleResponseDto> {
    const entity = await this.roleRepository.findOneByField({
      field: 'id',
      value: id,
    });

    const updatedEntity = this.roleDomainService.updateRoleEntity(entity, dto);

    const updated = await this.roleRepository.save(updatedEntity);
    return new RoleResponseDto(updated);
  }
}
