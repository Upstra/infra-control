import { RoleService } from './../../../roles/application/services/role.service';
import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserEndpointInterface } from '@/modules/users/application/interfaces/user.endpoint.interface';
import { UserUpdateDto } from '@/modules/users/application/dto/user.update.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';
import { User } from '@/modules/users/domain/entities/user.entity';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';

@Injectable()
export class UserService implements UserEndpointInterface {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly roleService: RoleService,
  ) {}

  async getUserById(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findUserById(id);
      return new UserResponseDto(user);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async findByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByUsername(username);
    return new UserResponseDto(user);
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
        '', // TODO
        '',
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

  createUser(user: User): Promise<User> {
    return this.userRepository.createUser(user);
  }

  async assertUsernameAndEmailAvailable(username: string, email: string) {
    const user = await this.userRepository.findByUsername(username);
    if (user) throw new ConflictException('Username already exists');

    const emailUser = await this.userRepository.findByEmail(email);
    if (emailUser) throw new ConflictException('Email already exists');
  }

  async getDefaultRoleId(): Promise<string> {
    //const guest = await this.roleRepository.findByName('Guest');
    //return guest?.id;
    return '1';
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
