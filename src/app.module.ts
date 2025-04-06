import { configModule } from './common/config/config.module';
import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from './modules/groups/group.module';
import { IloModule } from './modules/ilos/ilo.module';
import { UpsModule } from './modules/ups/ups.module';
import { RoleModule } from './modules/roles/role.module';
import { RoomModule } from './modules/rooms/room.module';
import { ServerModule } from './modules/servers/server.module';
import { UserModule } from './modules/users/user.module';
import { VmModule } from './modules/vms/vm.module';
import { PermissionModule } from './modules/permissions/permission.module';
import { typeOrmConfig } from './common/config/typeorm.config';

@Module({
  controllers: [],
  imports: [
    configModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    GroupModule,
    IloModule,
    UpsModule,
    RoleModule,
    RoomModule,
    ServerModule,
    UserModule,
    VmModule,
    PermissionModule,
  ],
  providers: [Logger],
})
export class AppModule {}
