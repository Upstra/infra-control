import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';

/**
 * Retrieves the list of all users in the system.
 *
 * Responsibilities:
 * - Delegates to UserDomainService to load all user entities.
 * - Maps each entity to UserDto for API clients.
 *
 * @returns Promise<UserDto[]> array of user DTOs.
 *
 * @remarks
 * Read-only; used by admin UIs and management panels.
 *
 * @example
 * const users = await getUserListUseCase.execute();
 */

export class GetUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
      relations: ['roles'],
    });
    return new UserResponseDto(user);
  }
}
