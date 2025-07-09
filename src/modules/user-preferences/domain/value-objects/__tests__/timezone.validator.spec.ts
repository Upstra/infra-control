import { validateTimezone, getValidTimezones } from '../timezone.validator';

describe('Timezone Validator', () => {
  describe('validateTimezone', () => {
    it('should return true for valid timezones', () => {
      const validTimezones = [
        'UTC',
        'Europe/Paris',
        'Europe/London',
        'America/New_York',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];

      validTimezones.forEach((timezone) => {
        expect(validateTimezone(timezone)).toBe(true);
      });
    });

    it('should return false for invalid timezones', () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'Europe/InvalidCity',
        'NotATimezone',
        '',
        'null',
        'undefined',
        'Europe/paris', // case sensitive
        'UTC+1', // not in our list
        'GMT',
      ];

      invalidTimezones.forEach((timezone) => {
        expect(validateTimezone(timezone)).toBe(false);
      });
    });

    it('should be case sensitive', () => {
      expect(validateTimezone('europe/paris')).toBe(false);
      expect(validateTimezone('Europe/Paris')).toBe(true);
    });
  });

  describe('getValidTimezones', () => {
    it('should return an array of valid timezones', () => {
      const timezones = getValidTimezones();

      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones).toContain('UTC');
      expect(timezones).toContain('Europe/Paris');
    });

    it('should return a copy of the timezone list', () => {
      const timezones1 = getValidTimezones();
      const timezones2 = getValidTimezones();

      expect(timezones1).not.toBe(timezones2);
      expect(timezones1).toEqual(timezones2);
    });

    it('should not allow modification of the original list', () => {
      const timezones = getValidTimezones();
      const originalLength = timezones.length;

      timezones.push('New/Timezone');

      const newTimezones = getValidTimezones();
      expect(newTimezones.length).toBe(originalLength);
      expect(newTimezones).not.toContain('New/Timezone');
    });

    it('should include major world timezones', () => {
      const timezones = getValidTimezones();
      const expectedTimezones = [
        'UTC',
        'Europe/Paris',
        'Europe/London',
        'Europe/Berlin',
        'America/New_York',
        'America/Los_Angeles',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
      ];

      expectedTimezones.forEach((tz) => {
        expect(timezones).toContain(tz);
      });
    });
  });
});
