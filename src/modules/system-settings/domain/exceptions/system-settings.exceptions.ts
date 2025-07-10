export class SystemSettingsNotFoundException extends Error {
  constructor() {
    super('System settings not found');
    this.name = 'SystemSettingsNotFoundException';
  }
}

export class InvalidSettingsCategoryException extends Error {
  constructor(category: string) {
    super(`Invalid settings category: ${category}`);
    this.name = 'InvalidSettingsCategoryException';
  }
}

export class EmailConfigurationException extends Error {
  constructor(message: string) {
    super(`Email configuration error: ${message}`);
    this.name = 'EmailConfigurationException';
  }
}

export class SettingsImportException extends Error {
  constructor(message: string) {
    super(`Settings import failed: ${message}`);
    this.name = 'SettingsImportException';
  }
}