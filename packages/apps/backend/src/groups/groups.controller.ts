import {
  type AddGroupMember,
  AddGroupMemberSchema,
  type CreateGroup,
  CreateGroupSchema,
  Permission,
  type UpdateGroup,
  UpdateGroupSchema,
} from "@easy-charts/easycharts-types";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { GroupsService } from "./groups.service";

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @RequirePermissions(Permission.USER_MANAGE)
  @Get()
  getAll() {
    return this.groupsService.getAllGroups();
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.groupsService.getGroupById(id);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateGroupSchema)) dto: CreateGroup,
    @Req() req: { user: string },
  ) {
    return this.groupsService.createGroup(dto, req.user);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateGroupSchema)) dto: UpdateGroup,
  ) {
    return this.groupsService.updateGroup(id, dto);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.groupsService.deleteGroup(id);
  }

  // ─── Members ────────────────────────────────────────────────────────────────

  @RequirePermissions(Permission.USER_MANAGE)
  @Get(":id/members")
  getMembers(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.groupsService.getGroupMembers(id);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Post(":id/members")
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(AddGroupMemberSchema)) dto: AddGroupMember,
    @Req() req: { user: string },
  ) {
    return this.groupsService.addMember(id, dto.userId, req.user);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Delete(":id/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("userId", new ParseUUIDPipe()) userId: string,
  ) {
    return this.groupsService.removeMember(id, userId);
  }
}
