import { Test, TestingModule } from '@nestjs/testing';
import { SetupController } from '../setup.controller';
import {
  GetSetupStatusUseCase,
  CompleteVmDiscoveryUseCase,
  CompleteSetupStepUseCase,
  GetSetupProgressUseCase,
  BulkCreateUseCase,
  BulkCreateWithDiscoveryUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
  ValidateIpUseCase,
  ValidateNameUseCase,
} from '../../use-cases';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { SensitiveOperationsGuard } from '@/core/guards/sensitive-operations.guard';
import { ApiUsageGuard } from '@/core/guards/api-usage.guard';

describe('SetupController', () => {
  let controller: SetupController;
  let getSetupStatusUseCase: GetSetupStatusUseCase;
  let completeVmDiscoveryUseCase: CompleteVmDiscoveryUseCase;
  let completeSetupStepUseCase: CompleteSetupStepUseCase;
  let getSetupProgressUseCase: GetSetupProgressUseCase;
  let bulkCreateUseCase: BulkCreateUseCase;
  let bulkCreateWithDiscoveryUseCase: BulkCreateWithDiscoveryUseCase;
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
    const mockGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

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
        { provide: BulkCreateWithDiscoveryUseCase, useValue: { execute: jest.fn() } },
        { provide: BulkValidationUseCase, useValue: { execute: jest.fn() } },
        { provide: GetTemplatesUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateTemplateUseCase, useValue: { execute: jest.fn() } },
        { provide: GetSetupProgressEnhancedUseCase, useValue: { execute: jest.fn() } },
        { provide: ValidateIpUseCase, useValue: { execute: jest.fn() } },
        { provide: ValidateNameUseCase, useValue: { execute: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockGuard)
      .overrideGuard(SensitiveOperationsGuard)
      .useValue(mockGuard)
      .overrideGuard(ApiUsageGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<SetupController>(SetupController);
    getSetupStatusUseCase = module.get(GetSetupStatusUseCase);
    completeVmDiscoveryUseCase = module.get(CompleteVmDiscoveryUseCase);
    completeSetupStepUseCase = module.get(CompleteSetupStepUseCase);
    getSetupProgressUseCase = module.get(GetSetupProgressUseCase);
    bulkCreateUseCase = module.get(BulkCreateUseCase);
    bulkCreateWithDiscoveryUseCase = module.get(BulkCreateWithDiscoveryUseCase);
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
        resources: {
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

  describe('POST /setup/bulk-create-with-discovery', () => {
    it('should create resources and trigger discovery', async () => {
      const dto = {
        rooms: [{ name: 'Room 1', tempId: 'temp_room_1' }],
        upsList: [{ name: 'UPS 1', ip: '192.168.1.100', tempId: 'temp_ups_1' }],
        servers: [
          {
            name: 'vCenter Server',
            type: 'vcenter',
            state: 'started',
            ip: '192.168.1.10',
            adminUrl: 'https://192.168.1.10',
            login: 'admin',
            password: 'password',
            grace_period_on: 30,
            grace_period_off: 30,
            priority: 1,
            tempId: 'temp_server_1',
          },
        ],
        enableDiscovery: true,
      };

      const expectedResponse = {
        success: true,
        created: {
          rooms: [{ id: 'room-123', name: 'Room 1', tempId: 'temp_room_1' }],
          upsList: [{ id: 'ups-123', name: 'UPS 1', tempId: 'temp_ups_1' }],
          servers: [{ id: 'server-123', name: 'vCenter Server', tempId: 'temp_server_1' }],
        },
        idMapping: {
          rooms: { temp_room_1: 'room-123' },
          ups: { temp_ups_1: 'ups-123' },
        },
        discoverySessionId: 'session-123',
        discoveryTriggered: true,
        vmwareServerCount: 1,
      };

      (bulkCreateWithDiscoveryUseCase.execute as jest.Mock).mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.bulkCreateWithDiscovery(dto, mockJwtPayload);

      expect(bulkCreateWithDiscoveryUseCase.execute).toHaveBeenCalledWith(
        {
          rooms: dto.rooms,
          upsList: dto.upsList,
          servers: dto.servers,
          enableDiscovery: true,
          discoverySessionId: undefined,
        },
        mockJwtPayload.userId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should create resources without discovery when disabled', async () => {
      const dto = {
        rooms: [{ name: 'Room 1', tempId: 'temp_room_1' }],
        upsList: [],
        servers: [
          {
            name: 'Linux Server',
            type: 'physical',
            state: 'started',
            ip: '192.168.1.20',
            adminUrl: 'https://192.168.1.20',
            login: 'root',
            password: 'password',
            grace_period_on: 30,
            grace_period_off: 30,
            priority: 1,
            tempId: 'temp_server_1',
          },
        ],
        enableDiscovery: false,
      };

      const expectedResponse = {
        success: true,
        created: {
          rooms: [{ id: 'room-123', name: 'Room 1', tempId: 'temp_room_1' }],
          upsList: [],
          servers: [{ id: 'server-123', name: 'Linux Server', tempId: 'temp_server_1' }],
        },
        idMapping: {
          rooms: { temp_room_1: 'room-123' },
          ups: {},
        },
        discoveryTriggered: false,
      };

      (bulkCreateWithDiscoveryUseCase.execute as jest.Mock).mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.bulkCreateWithDiscovery(dto, mockJwtPayload);

      expect(bulkCreateWithDiscoveryUseCase.execute).toHaveBeenCalledWith(
        {
          rooms: dto.rooms,
          upsList: dto.upsList,
          servers: dto.servers,
          enableDiscovery: false,
          discoverySessionId: undefined,
        },
        mockJwtPayload.userId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should use custom discovery session ID when provided', async () => {
      const dto = {
        rooms: [],
        upsList: [],
        servers: [
          {
            name: 'ESXi Host',
            type: 'esxi',
            state: 'started',
            ip: '192.168.1.30',
            adminUrl: 'https://192.168.1.30',
            login: 'root',
            password: 'password',
            grace_period_on: 30,
            grace_period_off: 30,
            priority: 1,
            tempId: 'temp_server_1',
          },
        ],
        enableDiscovery: true,
        discoverySessionId: 'custom-session-456',
      };

      const expectedResponse = {
        success: true,
        created: {
          rooms: [],
          upsList: [],
          servers: [{ id: 'server-123', name: 'ESXi Host', tempId: 'temp_server_1' }],
        },
        idMapping: {
          rooms: {},
          ups: {},
        },
        discoverySessionId: 'custom-session-456',
        discoveryTriggered: true,
        vmwareServerCount: 1,
      };

      (bulkCreateWithDiscoveryUseCase.execute as jest.Mock).mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.bulkCreateWithDiscovery(dto, mockJwtPayload);

      expect(bulkCreateWithDiscoveryUseCase.execute).toHaveBeenCalledWith(
        {
          rooms: dto.rooms,
          upsList: dto.upsList,
          servers: dto.servers,
          enableDiscovery: true,
          discoverySessionId: 'custom-session-456',
        },
        mockJwtPayload.userId,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});