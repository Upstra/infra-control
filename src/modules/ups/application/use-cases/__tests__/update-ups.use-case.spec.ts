import { UpdateUpsUseCase } from '../update-ups.use-case';
import { UpsDomainService } from '../../../domain/services/ups.domain.service';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { createMockUps } from '../../../__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../__mocks__/ups-telemetry.mock';

describe('UpdateUpsUseCase', () => {
  const repo = { findUpsById: jest.fn(), findByIdWithServerCount: jest.fn() };
  const manager = { save: jest.fn(), find: jest.fn(), update: jest.fn() };
  const dataSource = { transaction: jest.fn((work) => work(manager)) };
  const logHistory = { execute: jest.fn(), executeStructured: jest.fn() };
  const batteryCache = { get: jest.fn() };
  const useCase = new UpdateUpsUseCase(
    repo as any,
    new UpsDomainService(),
    dataSource as any,
    batteryCache as any,
    logHistory as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repo.findUpsById.mockImplementation(async () =>
      createMockUps({ id: 'ups-1', roomId: 'room-a' }),
    );
    repo.findByIdWithServerCount.mockImplementation(async () => ({
      ups: createMockUps({ id: 'ups-1', roomId: 'room-b' }),
      serverCount: 2,
    }));
  });

  it('moves the UPS and its servers in one transaction when moveServers is set', async () => {
    manager.find.mockResolvedValue([{ id: 'srv-1' }, { id: 'srv-2' }]);

    const result = await useCase.execute(
      'ups-1',
      { roomId: 'room-b', moveServers: true },
      'user-1',
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ roomId: 'room-b' }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'srv-2' },
      { roomId: 'room-b' },
    );
    expect(result).toBeInstanceOf(UpsResponseDto);
    expect(result.movedServerIds).toEqual(['srv-1', 'srv-2']);
    expect(logHistory.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'ups',
        action: 'UPDATE',
        oldValue: { roomId: 'room-a' },
        newValue: { roomId: 'room-b' },
        metadata: { movedServerIds: ['srv-1', 'srv-2'] },
      }),
    );
  });

  it('only updates the UPS fields without moveServers', async () => {
    batteryCache.get.mockResolvedValue(
      createMockBatteryStatus({ telemetry: createMockUpsTelemetry() }),
    );

    const result = await useCase.execute('ups-1', {
      roomId: 'room-b',
      nominalPowerW: 3000,
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ roomId: 'room-b', nominalPowerW: 3000 }),
    );
    expect(manager.find).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
    expect(result.movedServerIds).toBeUndefined();
    expect(result.nominalPowerSource).toBe('device');
  });

  it('propagates a server failure so the transaction rolls everything back', async () => {
    manager.find.mockResolvedValue([{ id: 'srv-1' }]);
    manager.update.mockRejectedValue(new Error('constraint violation'));

    await expect(
      useCase.execute('ups-1', { roomId: 'room-b', moveServers: true }),
    ).rejects.toThrow('constraint violation');
    expect(logHistory.executeStructured).not.toHaveBeenCalled();
    expect(repo.findByIdWithServerCount).not.toHaveBeenCalled();
  });
});
