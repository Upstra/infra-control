import { Test, TestingModule } from '@nestjs/testing';
import { SetupController } from '../setup.controller';
import { GetSetupStatusUseCase } from '../../use-cases';

describe('SetupController', () => {
  let controller: SetupController;
  let getSetupStatusUseCase: GetSetupStatusUseCase;

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
      ],
    }).compile();

    controller = module.get<SetupController>(SetupController);
    getSetupStatusUseCase = module.get(GetSetupStatusUseCase);
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
});
