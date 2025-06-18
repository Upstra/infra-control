import { SetupStatusMapper } from '../setup-status.mapper';
import { SetupPhase, SetupState } from '../../types';
import { SetupStep } from '../../dto/setup-status.dto';

describe('SetupStatusMapper', () => {
  let mapper: SetupStatusMapper;

  beforeEach(() => {
    mapper = new SetupStatusMapper();
  });

  const defaultCounts = {
    userCount: 1,
    roomCount: 0,
    upsCount: 0,
    serverCount: 0,
  };

  it('should map a first-time setup with no room to CREATE_ROOM step', () => {
    const state: SetupState = {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: 'create-room',
    };

    const result = mapper.toDto(state, defaultCounts, true);

    expect(result.currentStep).toBe(SetupStep.CREATE_ROOM);
    expect(result.isFirstSetup).toBe(true);
    expect(result.hasRooms).toBe(false);
    expect(result.hasUps).toBe(false);
    expect(result.hasServers).toBe(false);
    expect(result.isCurrentUserAdmin).toBe(true);
    expect(result.totalSteps).toBe(Object.keys(SetupStep).length);
    expect(result.currentStepIndex).toBeGreaterThanOrEqual(0);
  });

  it('should return COMPLETE step when nextRequiredStep is null', () => {
    const state: SetupState = {
      phase: SetupPhase.COMPLETED,
      hasAdminUser: true,
      hasInfrastructure: true,
      nextRequiredStep: null,
    };

    const counts = {
      userCount: 5,
      roomCount: 3,
      upsCount: 2,
      serverCount: 4,
    };

    const result = mapper.toDto(state, counts);

    expect(result.currentStep).toBe(SetupStep.COMPLETE);
    expect(result.hasRooms).toBe(true);
    expect(result.hasUps).toBe(true);
    expect(result.hasServers).toBe(true);
    expect(result.isFirstSetup).toBe(false);
    expect(result.isCurrentUserAdmin).toBeUndefined();
  });

  it('should fallback to COMPLETE for unknown next step', () => {
    const state: SetupState = {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: 'unknown-step',
    };

    const result = mapper.toDto(state, {
      userCount: 2,
      roomCount: 1,
      upsCount: 1,
      serverCount: 0,
    });

    expect(result.currentStep).toBe(SetupStep.COMPLETE);
  });
});
