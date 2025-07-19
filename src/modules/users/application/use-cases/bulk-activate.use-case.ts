import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserDomainService } from '@modules/users/domain/services/user.domain.service';
import { UserRepositoryInterface } from '@modules/users/domain/interfaces/user.repository.interface';
import { BulkActivateDto } from '../dto/bulk-activate.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserNotFoundException } from '@modules/users/domain/exceptions/user.exception';

@Injectable()
export class BulkActivateUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(bulkActivateDto: BulkActivateDto): Promise<UserResponseDto[]> {
    const { userIds } = bulkActivateDto;
    const activatedUsers = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new UserNotFoundException();
        }
        const activatedUser = await this.userDomainService.activateUser(user);
        const savedUser = await this.userRepository.save(activatedUser);
        activatedUsers.push(UserResponseDto.fromEntity(savedUser));
      } catch (error) {
        if (error instanceof NotFoundException) {
          errors.push({ userId, error: error.message });
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0 && activatedUsers.length === 0) {
      throw new NotFoundException('None of the provided user IDs were found');
    }

    return activatedUsers;
  }
}
