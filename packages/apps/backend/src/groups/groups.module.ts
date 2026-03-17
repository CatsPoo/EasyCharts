import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { UserEntity } from "../auth/entities/user.entity";
import { GroupEntity } from "./entities/group.entity";
import { GroupMembershipEntity } from "./entities/groupMembership.entity";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity, GroupMembershipEntity, UserEntity]),
    AuthModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
