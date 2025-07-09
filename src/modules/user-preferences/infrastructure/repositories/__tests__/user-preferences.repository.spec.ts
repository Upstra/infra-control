import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferencesRepository } from '../user-preferences.repository';
import { UserPreference } from '../../../domain/entities/user-preference.entity';

describe('UserPreferencesRepository', () => {
  let repository: UserPreferencesRepository;
  let typeormRepository: jest.Mocked<Repository<UserPreference>>;

  beforeEach(async () => {
    const mockTypeormRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesRepository,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    repository = module.get<UserPreferencesRepository>(UserPreferencesRepository);
    typeormRepository = module.get(getRepositoryToken(UserPreference));
  });

  describe('findByUserId', () => {
    it('should return user preferences when found', async () => {
      const userId = 'user-123';
      const mockPreference = {
        id: 'pref-123',
        userId,
        locale: 'fr',
        theme: 'dark',
      } as UserPreference;

      typeormRepository.findOne.mockResolvedValue(mockPreference);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual(mockPreference);
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null when no preferences found', async () => {
      const userId = 'user-123';
      typeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return new preferences', async () => {
      const preference = UserPreference.createDefault('user-123');
      const savedPreference = { ...preference, id: 'pref-123' };

      typeormRepository.save.mockResolvedValue(savedPreference);

      const result = await repository.create(preference);

      expect(result).toEqual(savedPreference);
      expect(typeormRepository.save).toHaveBeenCalledWith(preference);
    });
  });

  describe('update', () => {
    it('should update and return preferences', async () => {
      const preference = {
        id: 'pref-123',
        userId: 'user-123',
        locale: 'en',
        theme: 'light',
      } as UserPreference;

      typeormRepository.save.mockResolvedValue(preference);

      const result = await repository.update(preference);

      expect(result).toEqual(preference);
      expect(typeormRepository.save).toHaveBeenCalledWith(preference);
    });
  });

  describe('delete', () => {
    it('should delete preferences by id', async () => {
      const id = 'pref-123';
      typeormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete(id);

      expect(typeormRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should not throw when deleting non-existent preferences', async () => {
      const id = 'non-existent';
      typeormRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.delete(id)).resolves.not.toThrow();
    });
  });
});