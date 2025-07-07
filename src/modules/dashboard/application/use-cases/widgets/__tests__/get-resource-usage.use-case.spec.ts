import { Test, TestingModule } from '@nestjs/testing';
import { GetResourceUsageUseCase } from '../get-resource-usage.use-case';

describe('GetResourceUsageUseCase', () => {
  let useCase: GetResourceUsageUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetResourceUsageUseCase],
    }).compile();

    useCase = module.get<GetResourceUsageUseCase>(GetResourceUsageUseCase);
  });

  describe('execute', () => {
    it('should return resource usage data with correct structure', async () => {
      const result = await useCase.execute();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('network');
    });

    it('should return CPU usage data with correct format', async () => {
      const result = await useCase.execute();

      expect(result.cpu).toHaveProperty('usage');
      expect(result.cpu).toHaveProperty('trend');
      expect(result.cpu).toHaveProperty('history');
      expect(result.cpu.usage).toBe(65.5);
      expect(result.cpu.trend).toBe('up');
      expect(Array.isArray(result.cpu.history)).toBe(true);
      expect(result.cpu.history).toHaveLength(6);
    });

    it('should return memory usage data with correct format', async () => {
      const result = await useCase.execute();

      expect(result.memory).toHaveProperty('usage');
      expect(result.memory).toHaveProperty('trend');
      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('history');
      expect(result.memory.usage).toBe(78.2);
      expect(result.memory.trend).toBe('stable');
      expect(result.memory.total).toBe('512GB');
      expect(result.memory.used).toBe('400GB');
      expect(Array.isArray(result.memory.history)).toBe(true);
      expect(result.memory.history).toHaveLength(6);
    });

    it('should return storage usage data with correct format', async () => {
      const result = await useCase.execute();

      expect(result.storage).toHaveProperty('usage');
      expect(result.storage).toHaveProperty('trend');
      expect(result.storage).toHaveProperty('total');
      expect(result.storage).toHaveProperty('used');
      expect(result.storage).toHaveProperty('history');
      expect(result.storage.usage).toBe(45.0);
      expect(result.storage.trend).toBe('up');
      expect(result.storage.total).toBe('10TB');
      expect(result.storage.used).toBe('4.5TB');
      expect(Array.isArray(result.storage.history)).toBe(true);
      expect(result.storage.history).toHaveLength(6);
    });

    it('should return network usage data with correct format', async () => {
      const result = await useCase.execute();

      expect(result.network).toHaveProperty('inbound');
      expect(result.network).toHaveProperty('outbound');
      expect(result.network).toHaveProperty('trend');
      expect(result.network.inbound).toBe('125 Mbps');
      expect(result.network.outbound).toBe('89 Mbps');
      expect(result.network.trend).toBe('stable');
    });

    it('should generate history with timestamps and values', async () => {
      const result = await useCase.execute();

      result.cpu.history.forEach((point) => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('value');
        expect(point.timestamp).toBeInstanceOf(Date);
        expect(typeof point.value).toBe('number');
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    });

    it('should generate history with correct time intervals', async () => {
      const result = await useCase.execute();
      const history = result.cpu.history;

      for (let i = 1; i < history.length; i++) {
        const timeDiff = history[i].timestamp.getTime() - history[i - 1].timestamp.getTime();
        const expectedDiff = 5 * 60 * 1000; // 5 minutes in milliseconds
        expect(timeDiff).toBe(expectedDiff);
      }
    });

    it('should generate values with variance around base values', async () => {
      const result = await useCase.execute();

      // Test multiple times to ensure variance works
      for (let i = 0; i < 10; i++) {
        const testResult = await useCase.execute();
        
        testResult.cpu.history.forEach((point) => {
          expect(point.value).toBeCloseTo(65, 1); // Should be around 65 with some variance
        });

        testResult.memory.history.forEach((point) => {
          expect(point.value).toBeCloseTo(78, 1); // Should be around 78 with some variance
        });

        testResult.storage.history.forEach((point) => {
          expect(point.value).toBeCloseTo(45, 1); // Should be around 45 with some variance
        });
      }
    });

    it('should ensure history values stay within 0-100 bounds', async () => {
      // Test multiple executions to catch edge cases with random variance
      for (let i = 0; i < 50; i++) {
        const result = await useCase.execute();
        
        [...result.cpu.history, ...result.memory.history, ...result.storage.history].forEach((point) => {
          expect(point.value).toBeGreaterThanOrEqual(0);
          expect(point.value).toBeLessThanOrEqual(100);
        });
      }
    });
  });
});