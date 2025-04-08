import { configModule } from './common/config/config.module';
import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './common/config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { GroupModule } from './modules/groups/group.module';
import { IloModule } from './modules/ilos/ilo.module';
import { PermissionModule } from './modules/permissions/permission.module';
import { RoleModule } from './modules/roles/role.module';
import { RoomModule } from './modules/rooms/room.module';
import { ServerModule } from './modules/servers/server.module';
import { UpsModule } from './modules/ups/ups.module';
import { UserModule } from './modules/users/user.module';
import { VmModule } from './modules/vms/vm.module';

@Module({
  controllers: [],
  imports: [
    configModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    GroupModule,
    IloModule,
    PermissionModule,
    UpsModule,
    RoleModule,
    RoomModule,
    ServerModule,
    UserModule,
    VmModule,
  ],
  providers: [Logger],
})
export class AppModule {}
