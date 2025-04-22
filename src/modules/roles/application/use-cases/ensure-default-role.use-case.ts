import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserService } from '@/modules/users/application/services/user.service';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { forwardRef } from '@nestjs/common/utils';
@Injectable()
export class EnsureDefaultRoleUseCase {
  private readonly logger = new Logger(EnsureDefaultRoleUseCase.name);

  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async execute(): Promise<Role> {
    const [roles, userCount] = await Promise.all([
      this.roleRepository.findAll(),
      this.userService.getUserCount(),
    ]);

    if (roles.length === 0 && userCount === 0) {
      this.logger.warn('Création rôle ADMIN par défaut');
      const admin = await this.roleRepository.createRole('ADMIN');
      admin.canCreateServer = true;
      return this.roleRepository.save(admin);
    }

    if (userCount === 0) {
      try {
        const admin = await this.roleRepository.findByName('ADMIN');
        if (!admin.canCreateServer) {
          this.logger.warn('Correction des droits ADMIN');
          admin.canCreateServer = true;
          return this.roleRepository.save(admin);
        }
        return admin;
      } catch (e) {
        this.logger.error('ADMIN introuvable, fallback');
        const fallback = await this.roleRepository.createRole('ADMIN');
        fallback.canCreateServer = true;
        return this.roleRepository.save(fallback);
      }
    }

    let guest = await this.roleRepository.findByName('GUEST');
    if (!guest) {
      this.logger.warn('Création du rôle GUEST');
      guest = await this.roleRepository.createRole('GUEST');
      guest = await this.roleRepository.save(guest);
    }

    return guest;
  }
}
