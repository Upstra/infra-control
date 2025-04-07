import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserEndpointInterface } from '@/modules/users/application/interfaces/user.endpoint.interface';
import { UserUpdateDto } from '@/modules/users/application/dto/user.update.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';

@Injectable()
export class UserService implements UserEndpointInterface {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async getUserById(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findUserById(id);
      return new UserResponseDto(user);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UserUpdateDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.updateUser(
        id,
        updateUserDto.username,
        updateUserDto.password,
        updateUserDto.email,
        updateUserDto.roleId,
      );
      return new UserResponseDto(user);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepository.deleteUser(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof UserNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
