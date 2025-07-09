import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferencesController } from '../user-preferences.controller';
import {
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
  ResetUserPreferencesUseCase,
} from '../../use-cases';
import { UserPreferencesResponseDto } from '../../dto/user-preferences-response.dto';
import { UpdateUserPreferencesDto } from '../../dto/update-user-preferences.dto';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserPreference } from '../../../domain/entities/user-preference.entity';

describe('UserPreferencesController', () => {
  let controller: UserPreferencesController;
  let mockGetUseCase: jest.Mocked<GetUserPreferencesUseCase>;
  let mockUpdateUseCase: jest.Mocked<UpdateUserPreferencesUseCase>;
  let mockResetUseCase: jest.Mocked<ResetUserPreferencesUseCase>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
  } as User;

  const mockPreferences = {
    id: 'pref-123',
    userId: 'user-123',
    locale: 'fr',
    theme: 'dark',
    timezone: 'UTC',
    notifications: {
      server: true,
      ups: true,
      email: false,
      push: true,
    },
    display: {
      defaultUserView: 'table',
      defaultServerView: 'grid',
      compactMode: false,
    },
    integrations: {},
    performance: {
      autoRefresh: true,
      refreshInterval: 60,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserPreference;

  beforeEach(async () => {
    mockGetUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateUseCase = {
      execute: jest.fn(),
    } as any;

    mockResetUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPreferencesController],
      providers: [
        {
          provide: GetUserPreferencesUseCase,
          useValue: mockGetUseCase,
        },
        {
          provide: UpdateUserPreferencesUseCase,
          useValue: mockUpdateUseCase,
        },
        {
          provide: ResetUserPreferencesUseCase,
          useValue: mockResetUseCase,
        },
      ],
    }).compile();

    controller = module.get<UserPreferencesController>(
      UserPreferencesController,
    );
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      mockGetUseCase.execute.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences(mockUser);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(mockPreferences.id);
      expect(result.userId).toBe(mockPreferences.userId);
      expect(result.locale).toBe(mockPreferences.locale);
      expect(result.theme).toBe(mockPreferences.theme);
      expect(mockGetUseCase.execute).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return correct response DTO structure', async () => {
      mockGetUseCase.execute.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences(mockUser);

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        locale: expect.any(String),
        theme: expect.any(String),
        timezone: expect.any(String),
        notifications: expect.objectContaining({
          server: expect.any(Boolean),
          ups: expect.any(Boolean),
          email: expect.any(Boolean),
          push: expect.any(Boolean),
        }),
        display: expect.objectContaining({
          defaultUserView: expect.any(String),
          defaultServerView: expect.any(String),
          compactMode: expect.any(Boolean),
        }),
        integrations: expect.any(Object),
        performance: expect.objectContaining({
          autoRefresh: expect.any(Boolean),
          refreshInterval: expect.any(Number),
        }),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        locale: 'en',
        theme: 'light',
      };

      const updatedPreferences = {
        ...mockPreferences,
        locale: 'en' as const,
        theme: 'light' as const,
      };

      mockUpdateUseCase.execute.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockUser, updateDto);

      expect(result.locale).toBe('en');
      expect(result.theme).toBe('light');
      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        notifications: {
          email: true,
        },
      };

      const updatedPreferences = {
        ...mockPreferences,
        notifications: {
          ...mockPreferences.notifications,
          email: true,
        },
      };

      mockUpdateUseCase.execute.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockUser, updateDto);

      expect(result.notifications.email).toBe(true);
      expect(result.notifications.server).toBe(true); // unchanged
    });

    it('should update integrations', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        integrations: {
          slackWebhook: 'https://hooks.slack.com/services/test',
        },
      };

      const updatedPreferences = {
        ...mockPreferences,
        integrations: {
          slackWebhook: 'https://hooks.slack.com/services/test',
        },
      };

      mockUpdateUseCase.execute.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockUser, updateDto);

      expect(result.integrations).toEqual({
        slackWebhook: 'https://hooks.slack.com/services/test',
      });
    });
  });

  describe('resetPreferences', () => {
    it('should reset user preferences to defaults', async () => {
      const defaultPreferences = UserPreference.createDefault(mockUser.id);
      const resetResult = {
        ...defaultPreferences,
        id: mockPreferences.id,
        createdAt: mockPreferences.createdAt,
        updatedAt: new Date(),
      };

      mockResetUseCase.execute.mockResolvedValue(resetResult);

      const result = await controller.resetPreferences(mockUser);

      expect(result.locale).toBe('fr');
      expect(result.theme).toBe('dark');
      expect(result.timezone).toBe('UTC');
      expect(result.notifications).toEqual({
        server: true,
        ups: true,
        email: false,
        push: true,
      });
      expect(mockResetUseCase.execute).toHaveBeenCalledWith(mockUser.id);
    });

    it('should preserve user ID when resetting', async () => {
      const resetResult = {
        ...UserPreference.createDefault(mockUser.id),
        id: mockPreferences.id,
        createdAt: mockPreferences.createdAt,
        updatedAt: new Date(),
      };

      mockResetUseCase.execute.mockResolvedValue(resetResult);

      const result = await controller.resetPreferences(mockUser);

      expect(result.userId).toBe(mockUser.id);
      expect(result.id).toBe(mockPreferences.id);
    });
  });

  describe('toResponseDto', () => {
    it('should correctly transform entity to response DTO', async () => {
      mockGetUseCase.execute.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences(mockUser);

      expect(result).not.toBe(mockPreferences); // Should be a new object
      expect(result).toEqual({
        id: mockPreferences.id,
        userId: mockPreferences.userId,
        locale: mockPreferences.locale,
        theme: mockPreferences.theme,
        timezone: mockPreferences.timezone,
        notifications: mockPreferences.notifications,
        display: mockPreferences.display,
        integrations: mockPreferences.integrations,
        performance: mockPreferences.performance,
        createdAt: mockPreferences.createdAt,
        updatedAt: mockPreferences.updatedAt,
      });
    });
  });
});