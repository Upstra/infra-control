import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

/**
 * Fetches a user’s details using their username.
 *
 * Responsibilities:
 * - Validates the username format.
 * - Delegates to UserDomainService to find the user by username.
 * - Returns UserDto on success.
 *
 * @param username  The login username to look up.
 * @returns         Promise<UserDto> the corresponding user DTO.
 *
 * @throws NotFoundException if no user matches the username.
 *
 * @example
 * const user = await getUserByUsernameUseCase.execute('jdoe');
 */

@Injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(username: string): Promise<User> {
    const user = await this.userRepo.findOneByField({
      field: 'username',
      value: username,
      relations: ['roles'],
    });
    return user;
  }
}
