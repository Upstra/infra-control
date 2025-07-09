import { Injectable, Inject } from '@nestjs/common';
import { UserDomainService } from '@modules/users/domain/services/user.domain.service';
import { UserRepositoryInterface } from '@modules/users/domain/interfaces/user.repository.interface';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserExceptions } from '@modules/users/domain/exceptions/user.exception';

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
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw UserExceptions.notFound();
    }

    const updatedUser = await this.userDomainService.updateAccount(
      user,
      updateData,
    );
    const savedUser = await this.userRepository.save(updatedUser);
    return UserResponseDto.fromEntity(savedUser);
  }
}
