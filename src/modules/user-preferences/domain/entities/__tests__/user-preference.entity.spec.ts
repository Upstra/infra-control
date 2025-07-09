import { UserPreference } from '../user-preference.entity';

describe('UserPreference Entity', () => {
  describe('createDefault', () => {
    const userId = 'user-123';

    it('should create default preferences with correct values', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences).toBeInstanceOf(UserPreference);
      expect(preferences.userId).toBe(userId);
      expect(preferences.locale).toBe('fr');
      expect(preferences.theme).toBe('dark');
      expect(preferences.timezone).toBe('UTC');
    });

    it('should set default notification preferences', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.notifications).toEqual({
        server: true,
        ups: true,
        email: false,
        push: true,
      });
    });

    it('should set default display preferences', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.display).toEqual({
        defaultUserView: 'table',
        defaultServerView: 'grid',
        compactMode: false,
      });
    });

    it('should set empty integrations by default', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.integrations).toEqual({});
    });

    it('should set default performance preferences', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.performance).toEqual({
        autoRefresh: true,
        refreshInterval: 60,
      });
    });

    it('should not set ID for new preferences', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.id).toBeUndefined();
    });

    it('should not set timestamps for new preferences', () => {
      const preferences = UserPreference.createDefault(userId);

      expect(preferences.createdAt).toBeUndefined();
      expect(preferences.updatedAt).toBeUndefined();
    });

    it('should create different instances for different users', () => {
      const preferences1 = UserPreference.createDefault('user-1');
      const preferences2 = UserPreference.createDefault('user-2');

      expect(preferences1).not.toBe(preferences2);
      expect(preferences1.userId).toBe('user-1');
      expect(preferences2.userId).toBe('user-2');
    });

    it('should create deep copies of default objects', () => {
      const preferences1 = UserPreference.createDefault(userId);
      const preferences2 = UserPreference.createDefault(userId);

      preferences1.notifications.email = true;
      preferences1.display.compactMode = true;

      expect(preferences2.notifications.email).toBe(false);
      expect(preferences2.display.compactMode).toBe(false);
    });
  });

  describe('Entity structure', () => {
    it('should have all required properties', () => {
      const preference = new UserPreference();

      expect(preference).toHaveProperty('id');
      expect(preference).toHaveProperty('userId');
      expect(preference).toHaveProperty('locale');
      expect(preference).toHaveProperty('theme');
      expect(preference).toHaveProperty('timezone');
      expect(preference).toHaveProperty('notifications');
      expect(preference).toHaveProperty('display');
      expect(preference).toHaveProperty('integrations');
      expect(preference).toHaveProperty('performance');
      expect(preference).toHaveProperty('createdAt');
      expect(preference).toHaveProperty('updatedAt');
    });
  });
});