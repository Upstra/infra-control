import { SetupStatusDto, SetupStep } from '../../dto/setup-status.dto';
import { SetupPhase, SetupState } from '../../types';
import { GetSetupStatusUseCase } from '../get-setup-status.use-case';

describe('GetSetupStatusUseCase', () => {
  let useCase: GetSetupStatusUseCase;

  const userRepo = { count: jest.fn(), findOneByField: jest.fn() };
  const roomRepo = { count: jest.fn() };
  const upsRepo = { count: jest.fn() };
  const serverRepo = { count: jest.fn() };
  const setupprogressRepo = { findOneByField: jest.fn() };

  const setupDomainService = {
    determineSetupState: jest.fn(),
  };

  const setupStatusMapper = {
    toDto: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetSetupStatusUseCase(
      userRepo as any,
      roomRepo as any,
      serverRepo as any,
      upsRepo as any,
      setupprogressRepo as any,
      setupDomainService as any,
      setupStatusMapper as any,
    );
  });

  it('should return setup status for unauthenticated user (no userId)', async () => {
    userRepo.count.mockResolvedValue(1);
    roomRepo.count.mockResolvedValue(0);
    upsRepo.count.mockResolvedValue(0);
    serverRepo.count.mockResolvedValue(0);

    const setupState: SetupState = {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: 'rooms',
    };

    setupDomainService.determineSetupState.mockReturnValue(setupState);

    const expectedDto: SetupStatusDto = {
      isFirstSetup: true,
      hasAdminUser: true,
      hasRooms: false,
      hasUps: false,
      hasServers: false,
      currentStep: SetupStep.ROOMS_CONFIG,
      totalSteps: 5,
      currentStepIndex: 1,
    };

    setupStatusMapper.toDto.mockReturnValue(expectedDto);

    const result = await useCase.execute();

    expect(setupDomainService.determineSetupState).toHaveBeenCalledWith(
      1,
      0,
      0,
      0,
      false,
    );
    expect(setupStatusMapper.toDto).toHaveBeenCalledWith(
      setupState,
      {
        userCount: 1,
        roomCount: 0,
        upsCount: 0,
        serverCount: 0,
      },
      undefined,
      false,
    );

    expect(result).toBe(expectedDto);
  });

  it('should return setup status and detect admin user (authenticated)', async () => {
    const userId = 'user-123';

    userRepo.count.mockResolvedValue(2);
    roomRepo.count.mockResolvedValue(1);
    upsRepo.count.mockResolvedValue(1);
    serverRepo.count.mockResolvedValue(0);

    userRepo.findOneByField.mockResolvedValue({
      role: { canCreateServer: true },
    });

    const setupState: SetupState = {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: 'servers',
    };

    setupDomainService.determineSetupState.mockReturnValue(setupState);

    const expectedDto: SetupStatusDto = {
      isFirstSetup: false,
      hasAdminUser: true,
      hasRooms: true,
      hasUps: true,
      hasServers: false,
      currentStep: SetupStep.SERVERS_CONFIG,
      isCurrentUserAdmin: true,
      totalSteps: 5,
      currentStepIndex: 3,
    };

    setupStatusMapper.toDto.mockReturnValue(expectedDto);

    const result = await useCase.execute(userId);

    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: userId,
      disableThrow: true,
      relations: ['roles'],
    });

    expect(result).toEqual(expectedDto);
  });

  it('should fallback to isCurrentUserAdmin = false if user lookup fails', async () => {
    userRepo.count.mockResolvedValue(1);
    roomRepo.count.mockResolvedValue(1);
    upsRepo.count.mockResolvedValue(1);
    serverRepo.count.mockResolvedValue(0);

    userRepo.findOneByField.mockRejectedValue(new Error('User not found'));

    const setupState: SetupState = {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: 'servers',
    };

    setupDomainService.determineSetupState.mockReturnValue(setupState);

    const expectedDto: SetupStatusDto = {
      isFirstSetup: true,
      hasAdminUser: true,
      hasRooms: true,
      hasUps: true,
      hasServers: false,
      currentStep: SetupStep.SERVERS_CONFIG,
      isCurrentUserAdmin: false,
      totalSteps: 5,
      currentStepIndex: 3,
    };

    setupStatusMapper.toDto.mockReturnValue(expectedDto);

    const result = await useCase.execute('user-unknown');

    expect(result).toEqual(expectedDto);
    expect(setupStatusMapper.toDto).toHaveBeenCalledWith(
      setupState,
      expect.objectContaining({ serverCount: 0 }),
      false,
      false,
    );
  });
});
