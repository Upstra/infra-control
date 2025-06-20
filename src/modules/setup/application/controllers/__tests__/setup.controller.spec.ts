import { Test, TestingModule } from '@nestjs/testing';
import { SetupController } from '../setup.controller';
import {
  GetSetupStatusUseCase,
  CompleteVmDiscoveryUseCase,
  CompleteSetupStepUseCase,
  GetSetupProgressUseCase,
} from '../../use-cases';

describe('SetupController', () => {
  let controller: SetupController;
  let getSetupStatusUseCase: GetSetupStatusUseCase;
  let completeVmDiscoveryUseCase: CompleteVmDiscoveryUseCase;
  let completeSetupStepUseCase: CompleteSetupStepUseCase;
  let getSetupProgressUseCase: GetSetupProgressUseCase;

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
      ],
    }).compile();

    controller = module.get<SetupController>(SetupController);
    getSetupStatusUseCase = module.get(GetSetupStatusUseCase);
    completeVmDiscoveryUseCase = module.get(CompleteVmDiscoveryUseCase);
    completeSetupStepUseCase = module.get(CompleteSetupStepUseCase);
    getSetupProgressUseCase = module.get(GetSetupProgressUseCase);
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
});
