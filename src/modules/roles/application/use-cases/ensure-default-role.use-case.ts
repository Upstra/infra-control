import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { GetUserCountUseCase } from '@/modules/users/application/use-cases';

@Injectable()
export class EnsureDefaultRoleUseCase {
  private readonly logger = new Logger(EnsureDefaultRoleUseCase.name);

  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    @Inject(forwardRef(() => GetUserCountUseCase))
    private readonly getUserCountUseCase: GetUserCountUseCase,
  ) {}

  async execute(): Promise<Role> {
    const [roles, userCount] = await Promise.all([
      this.roleRepository.findAll(),
      this.getUserCountUseCase.execute(),
    ]);

    if (roles.length === 0 && userCount === 0) {
      this.logger.warn('Création rôle ADMIN par défaut');
      const admin = await this.roleRepository.createRole('ADMIN');
      admin.canCreateServer = true;
      return this.roleRepository.save(admin);
    }

    if (userCount === 0) {
      try {
        const admin = await this.roleRepository.findOneByField({
          field: 'name',
          value: 'ADMIN',
          disableThrow: true,
          relations: ['users', 'permissionServers', 'permissionVms'],
        });

        if (!admin.canCreateServer) {
          this.logger.warn('Correction des droits ADMIN');
          admin.canCreateServer = true;
          return this.roleRepository.save(admin);
        }
        return admin;
      } catch (e) {
        this.logger.error(
          `ADMIN introuvable, fallback à la création, erreur: ${e}`,
        );
        const fallback = await this.roleRepository.createRole('ADMIN');
        fallback.canCreateServer = true;
        return this.roleRepository.save(fallback);
      }
    }

    let guest = await this.roleRepository.findOneByField({
      field: 'name',
      value: 'GUEST',
      disableThrow: true,
      relations: ['users', 'permissionServers', 'permissionVms'],
    });

    if (!guest) {
      this.logger.warn('Création du rôle GUEST');
      guest = await this.roleRepository.createRole('GUEST');
    }

    return guest;
  }
}
