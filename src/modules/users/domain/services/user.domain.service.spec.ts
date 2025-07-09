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
      expect(user.roles[0]).toBe(role);
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

      const dto: UserUpdateDto = {
        username: 'newuser',
        firstName: 'New',
        lastName: undefined,
        email: 'new@mail.com',
      };

      const updated = await service.updateUserEntity(user, dto);
      expect(updated.username).toBe('newuser');
      expect(updated.firstName).toBe('New');
      expect(updated.lastName).toBe('Name'); // non modifié
      expect(updated.email).toBe('new@mail.com');
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

  describe('updateAccount', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
      user.id = 'user-id';
      user.firstName = 'Old';
      user.lastName = 'Name';
      user.email = 'old@email.com';
      user.isActive = false;
      user.isVerified = false;
      user.updatedAt = new Date('2023-01-01');
    });

    it('should update firstName when provided', async () => {
      const dto = { firstName: 'New' };
      const result = await service.updateAccount(user, dto);

      expect(result.firstName).toBe('New');
      expect(result.lastName).toBe('Name');
      expect(result.email).toBe('old@email.com');
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should update lastName when provided', async () => {
      const dto = { lastName: 'UpdatedName' };
      const result = await service.updateAccount(user, dto);

      expect(result.firstName).toBe('Old');
      expect(result.lastName).toBe('UpdatedName');
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should update email when provided and ensure uniqueness', async () => {
      const spy = jest.spyOn(service, 'ensureUniqueEmail').mockResolvedValue();
      const dto = { email: 'NEW@EMAIL.COM' };
      const result = await service.updateAccount(user, dto);

      expect(spy).toHaveBeenCalledWith('NEW@EMAIL.COM', 'user-id');
      expect(result.email).toBe('new@email.com');
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should update isActive when provided', async () => {
      const dto = { isActive: true };
      const result = await service.updateAccount(user, dto);

      expect(result.isActive).toBe(true);
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should update isVerified when provided', async () => {
      const dto = { isVerified: true };
      const result = await service.updateAccount(user, dto);

      expect(result.isVerified).toBe(true);
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should update multiple fields at once', async () => {
      const spy = jest.spyOn(service, 'ensureUniqueEmail').mockResolvedValue();
      const dto = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        email: 'new@test.com',
        isActive: true,
        isVerified: true,
      };
      const result = await service.updateAccount(user, dto);

      expect(result.firstName).toBe('NewFirst');
      expect(result.lastName).toBe('NewLast');
      expect(result.email).toBe('new@test.com');
      expect(result.isActive).toBe(true);
      expect(result.isVerified).toBe(true);
      expect(spy).toHaveBeenCalledWith('new@test.com', 'user-id');
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should not update fields when undefined', async () => {
      const dto = {
        firstName: undefined,
        lastName: undefined,
        email: undefined,
        isActive: undefined,
        isVerified: undefined,
      };
      const result = await service.updateAccount(user, dto);

      expect(result.firstName).toBe('Old');
      expect(result.lastName).toBe('Name');
      expect(result.email).toBe('old@email.com');
      expect(result.isActive).toBe(false);
      expect(result.isVerified).toBe(false);
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });

    it('should handle empty string values', async () => {
      const dto = {
        firstName: '',
        lastName: '',
      };
      const result = await service.updateAccount(user, dto);

      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
    });
  });

  describe('activateUser', () => {
    it('should set isActive to true and update updatedAt', async () => {
      const user = new User();
      user.isActive = false;
      user.updatedAt = new Date('2023-01-01');

      const result = await service.activateUser(user);

      expect(result.isActive).toBe(true);
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt even if user is already active', async () => {
      const user = new User();
      user.isActive = true;
      user.updatedAt = new Date('2023-01-01');

      const result = await service.activateUser(user);

      expect(result.isActive).toBe(true);
      expect(result.updatedAt).not.toEqual(new Date('2023-01-01'));
    });
  });
});
