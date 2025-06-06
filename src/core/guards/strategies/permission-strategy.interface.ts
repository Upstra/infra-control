export interface PermissionCheckStrategy {
  checkPermission(
    userId: string,
    resourceId: string,
    requiredBit: number,
  ): Promise<boolean>;
}

export interface PermissionStrategyFactory {
  getStrategy(resourceType: string): PermissionCheckStrategy;
}
