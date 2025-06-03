/**
 * Bitmask for permissions
 *
 * This enum is used to represent the permissions of a user or a role.
 *
 * Each permission corresponds to a specific bit, allowing them to be combined (e.g., READ | WRITE).
 *
 * Examples of usage :
 *   - Grant read and write permissions : PermissionBit.READ | PermissionBit.WRITE (= 3)
 *   - Check permission :
 *       PermissionUtils.has(userPermission.bitmask, PermissionBit.DELETE)
 *
 * Add a new permission :
 *   - Follow the logical sequence (1 << N), N being the next index.
 */
export enum PermissionBit {
  READ = 1 << 0, // 1
  WRITE = 1 << 1, // 2
  DELETE = 1 << 2, // 4
  RESTART = 1 << 3, // 8
  SHUTDOWN = 1 << 4, // 16
  SNAPSHOT = 1 << 5, // 32
}
