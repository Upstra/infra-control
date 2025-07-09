import { ExportWidgetDataUseCase } from '../export-widget-data.use-case';
import { ExportQueryDto } from '../../../dto/widget-data.dto';

describe('ExportWidgetDataUseCase', () => {
  let useCase: ExportWidgetDataUseCase;

  beforeEach(() => {
    useCase = new ExportWidgetDataUseCase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const widgetId = 'widget-123';
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should export data in JSON format', async () => {
      const query: ExportQueryDto = {
        format: 'json',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.contentType).toBe('application/json');
      expect(result.filename).toBe('widget-widget-123-export-2024-01-01.json');

      const parsedData = JSON.parse(result.data as string);
      expect(parsedData).toEqual({
        widgetId: 'widget-123',
        exportDate: mockDate.toISOString(),
        data: [],
      });
    });

    it('should export data in CSV format', async () => {
      const query: ExportQueryDto = {
        format: 'csv',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toBe('widget-widget-123-export-2024-01-01.csv');
      expect(result.data).toBe('id,timestamp,value\n1,2024-01-01,100');
    });

    it('should export data in XLSX format', async () => {
      const query: ExportQueryDto = {
        format: 'xlsx',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.contentType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.filename).toBe('widget-widget-123-export-2024-01-01.xlsx');
      expect(result.data).toBeInstanceOf(Buffer);
      expect((result.data as Buffer).toString()).toBe('Excel file content');
    });

    it('should throw error for unsupported format', async () => {
      const query = {
        format: 'pdf',
      } as any;

      await expect(useCase.execute(widgetId, query)).rejects.toThrow(
        'Unsupported export format: pdf',
      );
    });

    it('should handle query with additional filters for JSON', async () => {
      const query: ExportQueryDto = {
        format: 'json',
        page: 1,
        limit: 10,
        dateFrom: '2023-12-01',
        dateTo: '2024-01-01',
        severity: 'critical',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.contentType).toBe('application/json');
      const parsedData = JSON.parse(result.data as string);
      expect(parsedData.widgetId).toBe(widgetId);
    });

    it('should handle query with additional filters for CSV', async () => {
      const query: ExportQueryDto = {
        format: 'csv',
        page: 2,
        limit: 50,
        dateFrom: '2023-11-01',
        dateTo: '2023-12-31',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.contentType).toBe('text/csv');
      expect(result.data).toContain('id,timestamp,value');
    });

    it('should generate unique filename with current date', async () => {
      const query: ExportQueryDto = {
        format: 'json',
      };

      jest.setSystemTime(new Date('2024-06-15T10:30:00Z'));
      const result = await useCase.execute('widget-456', query);

      expect(result.filename).toBe('widget-widget-456-export-2024-06-15.json');
    });

    it('should handle different widget IDs correctly', async () => {
      const query: ExportQueryDto = {
        format: 'csv',
      };

      const result1 = await useCase.execute('widget-abc', query);
      const result2 = await useCase.execute('widget-xyz', query);

      expect(result1.filename).toContain('widget-abc');
      expect(result2.filename).toContain('widget-xyz');
    });

    it('should return string data for JSON format', async () => {
      const query: ExportQueryDto = {
        format: 'json',
      };

      const result = await useCase.execute(widgetId, query);

      expect(typeof result.data).toBe('string');
      expect(() => JSON.parse(result.data as string)).not.toThrow();
    });

    it('should return string data for CSV format', async () => {
      const query: ExportQueryDto = {
        format: 'csv',
      };

      const result = await useCase.execute(widgetId, query);

      expect(typeof result.data).toBe('string');
      expect(result.data).toMatch(/^id,timestamp,value\n/);
    });

    it('should return Buffer data for XLSX format', async () => {
      const query: ExportQueryDto = {
        format: 'xlsx',
      };

      const result = await useCase.execute(widgetId, query);

      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should handle concurrent exports for different formats', async () => {
      const queries: ExportQueryDto[] = [
        { format: 'json' },
        { format: 'csv' },
        { format: 'xlsx' },
      ];

      const results = await Promise.all(
        queries.map((query) => useCase.execute(widgetId, query)),
      );

      expect(results[0].contentType).toBe('application/json');
      expect(results[1].contentType).toBe('text/csv');
      expect(results[2].contentType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });

    it('should handle empty widgetId', async () => {
      const query: ExportQueryDto = {
        format: 'json',
      };

      const result = await useCase.execute('', query);

      expect(result.filename).toBe('widget--export-2024-01-01.json');
      const parsedData = JSON.parse(result.data as string);
      expect(parsedData.widgetId).toBe('');
    });

    it('should properly format date in filename', async () => {
      const query: ExportQueryDto = {
        format: 'csv',
      };

      jest.setSystemTime(new Date('2024-12-25T23:59:59Z'));
      const result = await useCase.execute(widgetId, query);

      expect(result.filename).toBe('widget-widget-123-export-2024-12-25.csv');
    });
  });
});
