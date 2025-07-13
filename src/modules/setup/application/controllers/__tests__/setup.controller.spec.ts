import { Test, TestingModule } from '@nestjs/testing';
import { SetupController } from '../setup.controller';
import {
  GetSetupStatusUseCase,
  CompleteVmDiscoveryUseCase,
  CompleteSetupStepUseCase,
  GetSetupProgressUseCase,
  BulkCreateUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
  ValidateIpUseCase,
  ValidateNameUseCase,
} from '../../use-cases';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('SetupController', () => {
  let controller: SetupController;
  let getSetupStatusUseCase: GetSetupStatusUseCase;
  let completeVmDiscoveryUseCase: CompleteVmDiscoveryUseCase;
  let completeSetupStepUseCase: CompleteSetupStepUseCase;
  let getSetupProgressUseCase: GetSetupProgressUseCase;
  let bulkCreateUseCase: BulkCreateUseCase;
  let bulkValidationUseCase: BulkValidationUseCase;
  let getTemplatesUseCase: GetTemplatesUseCase;
  let createTemplateUseCase: CreateTemplateUseCase;
  let getSetupProgressEnhancedUseCase: GetSetupProgressEnhancedUseCase;
  let validateIpUseCase: ValidateIpUseCase;
  let validateNameUseCase: ValidateNameUseCase;

  const mockSetupStatus = {
    isFirstSetup: true,
    hasAdminUser: true,
    hasRooms: false,
    hasUps: false,
    hasServers: false,
    currentStep: 'create-room',
    currentStepIndex: 1,
    totalSteps: 5,
  };

  const mockJwtPayload: JwtPayload = {
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

  const useCaseMock = {
    execute: jest.fn().mockResolvedValue(mockSetupStatus),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetupController],
      providers: [
        {
          provide: GetSetupStatusUseCase,
          useValue: useCaseMock,
        },
        {
          provide: CompleteVmDiscoveryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CompleteSetupStepUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: GetSetupProgressUseCase, useValue: { execute: jest.fn() } },
        { provide: BulkCreateUseCase, useValue: { execute: jest.fn() } },
        { provide: BulkValidationUseCase, useValue: { execute: jest.fn() } },
        { provide: GetTemplatesUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateTemplateUseCase, useValue: { execute: jest.fn() } },
        { provide: GetSetupProgressEnhancedUseCase, useValue: { execute: jest.fn() } },
        { provide: ValidateIpUseCase, useValue: { execute: jest.fn() } },
        { provide: ValidateNameUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SetupController>(SetupController);
    getSetupStatusUseCase = module.get(GetSetupStatusUseCase);
    completeVmDiscoveryUseCase = module.get(CompleteVmDiscoveryUseCase);
    completeSetupStepUseCase = module.get(CompleteSetupStepUseCase);
    getSetupProgressUseCase = module.get(GetSetupProgressUseCase);
    bulkCreateUseCase = module.get(BulkCreateUseCase);
    bulkValidationUseCase = module.get(BulkValidationUseCase);
    getTemplatesUseCase = module.get(GetTemplatesUseCase);
    createTemplateUseCase = module.get(CreateTemplateUseCase);
    getSetupProgressEnhancedUseCase = module.get(GetSetupProgressEnhancedUseCase);
    validateIpUseCase = module.get(ValidateIpUseCase);
    validateNameUseCase = module.get(ValidateNameUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /setup/status (public)', () => {
    it('should return setup status with no userId', async () => {
      const req = { user: undefined };
      const result = await controller.getSetupStatus(req);

      expect(getSetupStatusUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockSetupStatus);
    });

    it('should return setup status with userId if available', async () => {
      const req = { user: { userId: 'abc-123' } };
      const result = await controller.getSetupStatus(req);

      expect(getSetupStatusUseCase.execute).toHaveBeenCalledWith('abc-123');
      expect(result).toEqual(mockSetupStatus);
    });
  });

  describe('GET /setup/status/authenticated (protected)', () => {
    it('should return setup status for authenticated user', async () => {
      const req = { user: { userId: 'secure-user-id' } };
      const result = await controller.getAuthenticatedSetupStatus(req);

      expect(getSetupStatusUseCase.execute).toHaveBeenCalledWith(
        'secure-user-id',
      );
      expect(result).toEqual(mockSetupStatus);
    });
  });

  describe('POST /setup/vm-discovery/complete', () => {
    it('should delegate to CompleteVmDiscoveryUseCase and return status', async () => {
      const body = { serverId: 's1', vmCount: 1 } as any;
      const req = { user: { userId: 'u1' } };
      (completeVmDiscoveryUseCase.execute as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.completeVmDiscovery(req, body);

      expect(completeVmDiscoveryUseCase.execute).toHaveBeenCalledWith(
        'u1',
        body,
      );
      expect(result).toEqual(mockSetupStatus);
    });
  });

  describe('POST /setup/step/complete', () => {
    it('should call CompleteSetupStepUseCase and return result', async () => {
      (completeSetupStepUseCase.execute as jest.Mock).mockResolvedValue('ok');
      const req = { user: { userId: 'u1' } };
      const body = { step: 'welcome', metadata: { a: 1 } } as any;

      const result = await controller.completeSetupStep(req, body);

      expect(completeSetupStepUseCase.execute).toHaveBeenCalledWith(
        'welcome',
        'u1',
        { a: 1 },
      );
      expect(result).toBe('ok');
    });
  });

  describe('GET /setup/progress', () => {
    it('should return progress list', async () => {
      (getSetupProgressUseCase.execute as jest.Mock).mockResolvedValue(['p']);

      const result = await controller.getSetupProgress();

      expect(getSetupProgressUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(['p']);
    });
  });

  describe('POST /setup/bulk', () => {
    it('should create bulk resources', async () => {
      const dto = {
        rooms: [{ name: 'Room 1' }],
        upsList: [],
        servers: [],
      };
      const expectedResponse = {
        success: true,
        createdResources: { rooms: 1, ups: 0, servers: 0 },
      };
      (bulkCreateUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.bulkCreate(dto, mockJwtPayload);

      expect(bulkCreateUseCase.execute).toHaveBeenCalledWith(dto, mockJwtPayload.userId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /setup/validate', () => {
    it('should validate resources', async () => {
      const dto = {
        configuration: {
          rooms: [{ name: 'Room 1' }],
          upsList: [],
          servers: [],
        },
        testConnectivity: true,
      };
      const expectedResponse = {
        valid: true,
        errors: [],
      };
      (bulkValidationUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.validateResources(dto);

      expect(bulkValidationUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GET /setup/templates', () => {
    it('should return templates list', async () => {
      const expectedResponse = {
        templates: [
          { id: '1', name: 'Template 1', type: 'predefined' },
        ],
      };
      (getTemplatesUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.getTemplates();

      expect(getTemplatesUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /setup/templates', () => {
    it('should create a new template', async () => {
      const dto = {
        name: 'My Template',
        description: 'Custom template',
        configuration: {
          rooms: [],
          upsList: [],
          servers: [],
        },
      };
      const expectedResponse = {
        id: 'template-123',
        name: 'My Template',
        description: 'Custom template',
        type: 'custom',
        createdBy: mockJwtPayload.email,
      };
      (createTemplateUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.createTemplate(dto, mockJwtPayload);

      expect(createTemplateUseCase.execute).toHaveBeenCalledWith(dto, mockJwtPayload);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GET /setup/progress/enhanced', () => {
    it('should return enhanced progress information', async () => {
      const expectedResponse = {
        currentStep: 'create-room',
        progress: 20,
        resources: {
          rooms: 0,
          ups: 0,
          servers: 0,
        },
      };
      (getSetupProgressEnhancedUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.getEnhancedProgress();

      expect(getSetupProgressEnhancedUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GET /setup/validate/ip', () => {
    it('should validate IP address', async () => {
      const expectedResponse = {
        valid: true,
        available: true,
      };
      (validateIpUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.validateIp('192.168.1.100', 'server', 'exclude-123');

      expect(validateIpUseCase.execute).toHaveBeenCalledWith({
        ip: '192.168.1.100',
        resourceType: 'server',
        excludeId: 'exclude-123',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should validate IP address without excludeId', async () => {
      const expectedResponse = {
        valid: true,
        available: true,
      };
      (validateIpUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.validateIp('192.168.1.100', 'ups', undefined);

      expect(validateIpUseCase.execute).toHaveBeenCalledWith({
        ip: '192.168.1.100',
        resourceType: 'ups',
        excludeId: undefined,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GET /setup/validate/name', () => {
    it('should validate resource name', async () => {
      const expectedResponse = {
        valid: true,
        available: true,
      };
      (validateNameUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.validateName('UPS-Primary', 'ups', 'exclude-456');

      expect(validateNameUseCase.execute).toHaveBeenCalledWith({
        name: 'UPS-Primary',
        resourceType: 'ups',
        excludeId: 'exclude-456',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should validate resource name without excludeId', async () => {
      const expectedResponse = {
        valid: true,
        available: true,
      };
      (validateNameUseCase.execute as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.validateName('Room-A', 'room', undefined);

      expect(validateNameUseCase.execute).toHaveBeenCalledWith({
        name: 'Room-A',
        resourceType: 'room',
        excludeId: undefined,
      });
      expect(result).toEqual(expectedResponse);
    });
  });
});