import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusController } from '../prometheus.controller';
import { register } from 'prom-client';
import { Response } from 'express';

jest.mock('prom-client', () => ({
  register: {
    metrics: jest.fn(),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
  },
}));

describe('PrometheusController', () => {
  let controller: PrometheusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrometheusController],
    }).compile();

    controller = module.get<PrometheusController>(PrometheusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics with correct content type', async () => {
      const mockMetrics = 'infra_control_process_cpu_user_seconds_total 0.1';
      (register.metrics as jest.Mock).mockResolvedValue(mockMetrics);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getMetrics(mockResponse);

      expect(register.metrics).toHaveBeenCalled();
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        register.contentType,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockMetrics);
    });

    it('should handle registry errors', async () => {
      const error = new Error('Registry error');
      (register.metrics as jest.Mock).mockRejectedValue(error);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(controller.getMetrics(mockResponse)).rejects.toThrow(
        'Registry error',
      );
    });
  });
});
