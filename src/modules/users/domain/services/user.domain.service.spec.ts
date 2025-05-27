import 'reflect-metadata';
import { UserDomainService } from './user.domain.service';
import { User } from '../entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { UserConflictException } from '../exceptions/user.exception';
import { UserUpdateDto } from '../../application/dto/user.update.dto';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcrypt = require('bcryptjs');

describe('UserDomainService', () => {
  let service: UserDomainService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
    };
    service = new UserDomainService(repo);
    jest.clearAllMocks();
  });

  describe('validatePassword', () => {
    it('should return true if passwords match', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const res = await service.validatePassword('hashedPass', 'plainPass');
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPass', 'hashedPass');
      expect(res).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      bcrypt.compare.mockResolvedValue(false);
      const res = await service.validatePassword('hashed', 'nope');
      expect(res).toBe(false);
    });
  });

  describe('isTwoFactorEnabled', () => {
    it('should return true if 2FA is enabled', () => {
      const user = { isTwoFactorEnabled: true } as User;
      expect(service.isTwoFactorEnabled(user)).toBe(true);
    });
    it('should return false if 2FA is not enabled', () => {
      const user = { isTwoFactorEnabled: false } as User;
      expect(service.isTwoFactorEnabled(user)).toBe(false);
    });
  });

  describe('createUserEntity', () => {
    it('should create a user entity with hashed password and defaults', async () => {
      bcrypt.hash.mockResolvedValue('hashpw');
      const role = { id: 'role-id', name: 'admin' } as Role;
      const user = await service.createUserEntity(
        'james',
        'pass',
        'USER@EXAMPLE.com',
        role,
        'Jean',
        'Dupont',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(user.username).toBe('james');
      expect(user.password).toBe('hashpw');
      expect(user.email).toBe('user@example.com');
      expect(user.role).toBe(role);
      expect(user.firstName).toBe('Jean');
      expect(user.lastName).toBe('Dupont');
      expect(user.isTwoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user entity with optional fields as empty if not set', async () => {
      bcrypt.hash.mockResolvedValue('hashpw');
      const role = { id: 'role-id', name: 'user' } as Role;
      const user = await service.createUserEntity(
        'lucas',
        'pw',
        'lucas@test.com',
        role,
      );
      expect(user.firstName).toBe('');
      expect(user.lastName).toBe('');
    });
  });

  describe('updateUserEntity', () => {
    it('should update only provided fields', async () => {
      const user = new User();
      user.username = 'old';
      user.firstName = 'Old';
      user.lastName = 'Name';
      user.email = 'old@mail.com';
      user.roleId = 'role1';

      const dto: UserUpdateDto = {
        username: 'newuser',
        firstName: 'New',
        lastName: undefined,
        email: 'new@mail.com',
        roleId: undefined,
      };

      const updated = await service.updateUserEntity(user, dto);
      expect(updated.username).toBe('newuser');
      expect(updated.firstName).toBe('New');
      expect(updated.lastName).toBe('Name'); // non modifié
      expect(updated.email).toBe('new@mail.com');
      expect(updated.roleId).toBe('role1');
    });

    it('should lower case email if provided', async () => {
      const user = new User();
      user.email = 'CAPS@MAIL.com';
      const dto: UserUpdateDto = { email: 'TEST@UPPER.com' };
      const updated = await service.updateUserEntity(user, dto);
      expect(updated.email).toBe('test@upper.com');
    });
  });

  describe('hashPassword', () => {
    it('should hash the password with bcrypt', async () => {
      bcrypt.hash.mockResolvedValue('pwHashed');
      const res = await service.hashPassword('azerty');
      expect(res).toBe('pwHashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('azerty', 10);
    });
  });

  describe('ensureUniqueField', () => {
    it('should resolve if no existing user', async () => {
      repo.findOneByField.mockResolvedValue(null);
      await expect(
        service.ensureUniqueField('email', 'test@mail.com', 'id1'),
      ).resolves.toBeUndefined();
    });

    it('should resolve if existing user is same as current user', async () => {
      repo.findOneByField.mockResolvedValue({ id: 'id1' });
      await expect(
        service.ensureUniqueField('username', 'lucas', 'id1'),
      ).resolves.toBeUndefined();
    });

    it('should throw UserConflictException if user exists with another id', async () => {
      repo.findOneByField.mockResolvedValue({ id: 'otherId' });
      await expect(
        service.ensureUniqueField('email', 'other@mail.com', 'id1'),
      ).rejects.toThrow(UserConflictException);
    });
  });

  describe('ensureUniqueEmail', () => {
    it('should delegate to ensureUniqueField', async () => {
      const spy = jest.spyOn(service, 'ensureUniqueField').mockResolvedValue();
      await service.ensureUniqueEmail('foo@bar.com', 'id1');
      expect(spy).toHaveBeenCalledWith('email', 'foo@bar.com', 'id1');
    });
  });

  describe('ensureUniqueUsername', () => {
    it('should delegate to ensureUniqueField', async () => {
      const spy = jest.spyOn(service, 'ensureUniqueField').mockResolvedValue();
      await service.ensureUniqueUsername('monuser', 'id2');
      expect(spy).toHaveBeenCalledWith('username', 'monuser', 'id2');
    });
  });
});
