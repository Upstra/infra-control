import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserDomainService } from '@modules/users/domain/services/user.domain.service';
import { UserRepositoryInterface } from '@modules/users/domain/interfaces/user.repository.interface';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserNotFoundError } from '@modules/users/domain/exceptions/user-not-found.error';

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    updateData: UpdateAccountDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);
      const updatedUser = await this.userDomainService.updateAccount(
        user,
        updateData,
      );
      const savedUser = await this.userRepository.save(updatedUser);
      return UserResponseDto.fromEntity(savedUser);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
