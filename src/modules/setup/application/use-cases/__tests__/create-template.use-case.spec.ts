import { Test, TestingModule } from '@nestjs/testing';
import { CreateTemplateUseCase } from '../create-template.use-case';
import { CreateTemplateRequestDto, TemplateType } from '../../dto';
import { CurrentUserInterface } from '../../../../auth/domain/interfaces/current-user.interface';

describe('CreateTemplateUseCase', () => {
  let useCase: CreateTemplateUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateTemplateUseCase],
    }).compile();

    useCase = module.get<CreateTemplateUseCase>(CreateTemplateUseCase);
  });

  describe('execute', () => {
    const currentUser: CurrentUserInterface = {
      userId: 'user-123',
      email: 'admin@example.com',
      username: 'admin',
      permissions: BigInt(0),
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

    it('should create a custom template', async () => {
      const result = await useCase.execute(validRequest, currentUser);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(validRequest.name);
      expect(result.description).toBe(validRequest.description);
      expect(result.type).toBe(TemplateType.CUSTOM);
      expect(result.configuration).toEqual(validRequest.configuration);
      expect(result.createdBy).toBe(currentUser.email);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for templates', async () => {
      const result1 = await useCase.execute(validRequest, currentUser);
      const result2 = await useCase.execute(
        { ...validRequest, name: 'Another Template' },
        currentUser,
      );

      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle empty configuration', async () => {
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

    it('should store template in memory', async () => {
      // First create a template
      await useCase.execute(validRequest, currentUser);

      // Access the private customTemplates map
      const customTemplatesMap = (useCase as any).customTemplates;

      expect(customTemplatesMap.size).toBe(1);
      const storedTemplate = Array.from(customTemplatesMap.values())[0];
      expect(storedTemplate.name).toBe(validRequest.name);
    });

    it('should log template creation', async () => {
      const loggerSpy = jest.spyOn((useCase as any).logger, 'log');

      await useCase.execute(validRequest, currentUser);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Created custom template 'My Custom Template' by user admin@example.com`,
      );
    });
  });
});
