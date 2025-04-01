import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../domain/interfaces/user.repository.interface';
import { UserResponseDto } from './dto/user.response.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async getUserById(id: string): Promise<UserResponseDto> {
    return null;
  }

  async updateUser(
    id: string,
    updateUserDto: UserResponseDto,
  ): Promise<UserResponseDto> {
    return null;
  }

  async deleteUser(id: string): Promise<void> {
    return null;
  }
}
