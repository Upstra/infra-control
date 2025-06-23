import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleListResponseDto } from '../dto/role.list.response.dto';

/**
 * Use case to retrieve a paginated list of roles.
 */
@Injectable()
export class GetRoleListUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  /**
   * Execute the use case.
   *
   * @param page - page number starting at 1
   * @param limit - number of roles per page
   */
  async execute(page = 1, limit = 10): Promise<RoleListResponseDto> {
    const [roles, total] = await this.roleRepository.paginate(page, limit);
    const dtos = roles.map((r) => new RoleResponseDto(r));
    return new RoleListResponseDto(dtos, total, page, limit);
  }
}
