import { RoleResponseDto } from '@/modules/roles/application/dto/role.response.dto';
import { RoleCreationDto } from '@/modules/roles/application/dto/role.creation.dto';

export interface RoleEndpointInterface {
  getAllRoles(): Promise<RoleResponseDto[]>;
  getRoleById(d: string): Promise<RoleResponseDto>;
  createRole(roleDto: RoleCreationDto): Promise<RoleResponseDto>;
  updateRole(id: string, roleDto: RoleCreationDto): Promise<RoleResponseDto>;
  deleteRole(id: string): Promise<void>;
}
