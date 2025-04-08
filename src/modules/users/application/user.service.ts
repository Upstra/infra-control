import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { UserRepositoryInterface } from '../domain/interfaces/user.repository.interface';
import { UserResponseDto } from './dto/user.response.dto';
import { User } from '../domain/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) { }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findUserById(id);
    return this.toDto(user);
  }

  async findByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByUsername(username);
    return this.toDto(user);
  }

  async findRawByUsername(username: string): Promise<User> {
    return this.userRepository.findByUsername(username);
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

  createUser(user: User): Promise<User> {
    return this.userRepository.createUser(
      user.username,
      user.password,
      user.email,
      user.roleId,
    );
  }

  async assertUsernameAndEmailAvailable(username: string, email: string) {
    const user = await this.userRepository.findByUsername(username);
    if (user) throw new ConflictException('Username already exists');

    const emailUser = await this.userRepository.findByEmail(email);
    if (emailUser) throw new ConflictException('Email already exists');
  }

  async getDefaultRoleId(): Promise<number> {
    const guest = await this.roleRepository.findOne({ where: { name: 'Guest' } });
    return guest?.id;
  }


  private toDto(user: User): UserResponseDto {
    return {
      username: user.username,
      email: user.email,
      roleId: user.role?.id,
    };
  }
}
