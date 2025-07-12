import { SetMetadata } from '@nestjs/common';

export interface ConnectivityRequirement {
  hostSource: 'body' | 'params' | 'query';
  hostField: string;
  required?: boolean;
  timeout?: number;
}

export const CONNECTIVITY_KEY = 'connectivity';

export const RequireConnectivity = (requirement: ConnectivityRequirement) =>
  SetMetadata(CONNECTIVITY_KEY, requirement);