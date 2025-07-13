import { Test, TestingModule } from '@nestjs/testing';
import { CreateTemplateUseCase } from '../create-template.use-case';
import { CreateTemplateRequestDto, TemplateType, TemplateResponseDto } from '../../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RedisSafeService } from '../../../../redis/application/services/redis-safe.service';

describe('CreateTemplateUseCase', () => {
  let useCase: CreateTemplateUseCase;
  let redisService: jest.Mocked<RedisSafeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTemplateUseCase,
        {
          provide: RedisSafeService,
          useValue: {
            safeGet: jest.fn(),
            safeSet: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateTemplateUseCase>(CreateTemplateUseCase);
    redisService = module.get(RedisSafeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const currentUser: JwtPayload = {
      userId: 'user-123',
      email: 'admin@example.com',
      isTwoFactorEnabled: false,
      role: {
        id: 'role-123',
        name: 'admin',
        permissionVms: [],
        permissionServers: [],
        canCreateServer: true,
        isAdmin: true,
      },
      isActive: true,
    };

    const validRequest: CreateTemplateRequestDto = {
      name: 'My Custom Template',
      description: 'A custom template for testing',
      configuration: {
        rooms: [{ name: 'Custom Room 1' }, { name: 'Custom Room 2' }],
        upsList: [{ name: 'Custom UPS 1', ip: '192.168.1.200' }],
        servers: [
          {
            name: 'Custom Server 1',
            state: 'stopped',
            grace_period_on: 30,
            grace_period_off: 30,
            adminUrl: 'https://192.168.1.20',
            ip: '192.168.1.20',
            login: 'admin',
            password: 'password',
            type: 'physical',
            priority: 1,
          },
        ],
      },
    };

    it('should create a custom template when no existing templates', async () => {
      redisService.safeGet.mockResolvedValue(null);
      redisService.safeSet.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest, currentUser);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^custom-\d+-[a-f0-9]{12}$/);
      expect(result.name).toBe(validRequest.name);
      expect(result.description).toBe(validRequest.description);
      expect(result.type).toBe(TemplateType.CUSTOM);
      expect(result.configuration).toEqual(validRequest.configuration);
      expect(result.createdBy).toBe(currentUser.email);
      expect(result.createdAt).toBeInstanceOf(Date);

      expect(redisService.safeGet).toHaveBeenCalledWith('setup:custom_templates');
      expect(redisService.safeSet).toHaveBeenCalledWith(
        'setup:custom_templates',
        expect.stringContaining(result.id)
      );
    });

    it('should append to existing templates', async () => {
      const existingTemplates: TemplateResponseDto[] = [
        {
          id: 'existing-template-1',
          name: 'Existing Template',
          description: 'An existing template',
          type: TemplateType.CUSTOM,
          configuration: { rooms: [], upsList: [], servers: [] },
          createdAt: new Date(),
          createdBy: 'other@example.com',
        },
      ];
      
      redisService.safeGet.mockResolvedValue(JSON.stringify(existingTemplates));
      redisService.safeSet.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest, currentUser);

      expect(redisService.safeSet).toHaveBeenCalledWith(
        'setup:custom_templates',
        expect.stringContaining('"existing-template-1"')
      );
      
      const savedData = JSON.parse(redisService.safeSet.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe('existing-template-1');
      expect(savedData[1].id).toBe(result.id);
    });

    it('should generate unique IDs for templates', async () => {
      redisService.safeGet.mockResolvedValue(null);
      redisService.safeSet.mockResolvedValue(undefined);

      const result1 = await useCase.execute(validRequest, currentUser);
      const result2 = await useCase.execute(
        { ...validRequest, name: 'Another Template' },
        currentUser,
      );

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^custom-\d+-[a-f0-9]{12}$/);
      expect(result2.id).toMatch(/^custom-\d+-[a-f0-9]{12}$/);
    });

    it('should handle empty configuration', async () => {
      redisService.safeGet.mockResolvedValue(null);
      redisService.safeSet.mockResolvedValue(undefined);

      const emptyConfigRequest: CreateTemplateRequestDto = {
        name: 'Empty Template',
        description: 'A template with no resources',
        configuration: {
          rooms: [],
          upsList: [],
          servers: [],
        },
      };

      const result = await useCase.execute(emptyConfigRequest, currentUser);

      expect(result).toBeDefined();
      expect(result.configuration.rooms).toHaveLength(0);
      expect(result.configuration.upsList).toHaveLength(0);
      expect(result.configuration.servers).toHaveLength(0);
    });

    it('should preserve partial configurations', async () => {
      redisService.safeGet.mockResolvedValue(null);
      redisService.safeSet.mockResolvedValue(undefined);

      const partialConfigRequest: CreateTemplateRequestDto = {
        name: 'Partial Template',
        description: 'A template with partial server config',
        configuration: {
          rooms: [{ name: 'Room 1' }],
          upsList: [],
          servers: [
            {
              name: 'Server 1',
              state: 'stopped',
              type: 'physical',
              // Other fields are optional in the template
            } as any,
          ],
        },
      };

      const result = await useCase.execute(partialConfigRequest, currentUser);

      expect(result.configuration.servers[0]).toHaveProperty(
        'name',
        'Server 1',
      );
      expect(result.configuration.servers[0]).toHaveProperty(
        'state',
        'stopped',
      );
      expect(result.configuration.servers[0]).toHaveProperty(
        'type',
        'physical',
      );
    });

    it('should log template creation', async () => {
      redisService.safeGet.mockResolvedValue(null);
      redisService.safeSet.mockResolvedValue(undefined);
      const loggerSpy = jest.spyOn((useCase as any).logger, 'log');

      await useCase.execute(validRequest, currentUser);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Created custom template 'My Custom Template' by user admin@example.com`,
      );
    });

    it('should handle empty JSON from Redis', async () => {
      redisService.safeGet.mockResolvedValue('');
      redisService.safeSet.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest, currentUser);

      expect(result).toBeDefined();
      expect(result.name).toBe(validRequest.name);
      
      const savedData = JSON.parse(redisService.safeSet.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(result.id);
    });

    it('should handle invalid JSON from Redis gracefully', async () => {
      redisService.safeGet.mockResolvedValue('invalid-json');
      redisService.safeSet.mockResolvedValue(undefined);

      await expect(useCase.execute(validRequest, currentUser)).rejects.toThrow();
    });
  });
});
