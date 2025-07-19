import { BadRequestException } from '@nestjs/common';
import { CompleteSetupStepUseCase } from '../complete-setup-step.use-case';
import { SetupStep } from '../../dto/setup-status.dto';

describe('CompleteSetupStepUseCase', () => {
  let useCase: CompleteSetupStepUseCase;
  const repo = { findByStep: jest.fn(), save: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CompleteSetupStepUseCase(repo);
  });

  it('creates progress when step not completed', async () => {
    repo.findByStep.mockResolvedValue(null);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.execute(SetupStep.UPS_CONFIG, 'user1', {
      note: 'done',
    });

    expect(repo.save).toHaveBeenCalled();
    expect(result.step).toBe(SetupStep.UPS_CONFIG);
    expect(result.completedBy).toBe('user1');
  });

  it('throws when step already completed', async () => {
    repo.findByStep.mockResolvedValue({ completedAt: 'yesterday' });
    await expect(
      useCase.execute(SetupStep.UPS_CONFIG, 'user1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses empty metadata when not provided', async () => {
    repo.findByStep.mockResolvedValue(null);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.execute(SetupStep.WELCOME, 'user2');
    expect(result.metadata).toEqual({});
  });
});
