import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

/**
 * Retrieves a user’s profile by email address.
 *
 * Responsibilities:
 * - Validates the email format.
 * - Uses UserDomainService to find the user by email.
 * - Maps the result to UserDto.
 *
 * @param email  The user’s email address.
 * @returns      Promise<UserDto> the matching user DTO.
 *
 * @throws NotFoundException if no user exists with the email.
 *
 * @example
 * const user = await getUserByEmailUseCase.execute('user@example.com');
 */

@Injectable()
export class GetUserByEmailUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(email: string): Promise<User> {
    const user = await this.userRepo.findOneByField({
      field: 'email',
      value: email,
    });
    return user;
  }
}
