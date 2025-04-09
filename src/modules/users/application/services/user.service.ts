import { RoleService } from '../../../roles/application/services/role.service';
import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  ConflictException,
  forwardRef,
} from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserEndpointInterface } from '../interfaces/user.endpoint.interface';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserNotFoundException } from '../../domain/exceptions/user.notfound.exception';
import { User } from '../../domain/entities/user.entity';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { RegisterDto } from '../../../auth/dto/register.dto';

@Injectable()
export class UserService implements UserEndpointInterface {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly userDomain: UserDomainService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
  ) { }

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

  async findRawByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findByUsername(username);
    return user;
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

  async assertUsernameAndEmailAvailable(username: string, email: string) {
    const user = await this.userRepository.findByUsername(username);
    if (user) throw new ConflictException('Username already exists');

    const emailUser = await this.userRepository.findByEmail(email);
    if (emailUser) throw new ConflictException('Email already exists');
  }

  async registerWithDefaultRole(dto: RegisterDto): Promise<User> {
    await this.assertUsernameAndEmailAvailable(dto.username, dto.email);

    const role = await this.roleService.ensureDefaultRole();

    const user = await this.userDomain.createUserEntity(
      dto.username,
      dto.password,
      dto.email,
      role,
      dto.firstName,
      dto.lastName,
    );

    return this.userRepository.save(user);
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

  async getUserCount(): Promise<number> {
    return this.userRepository.count();
  }
}
