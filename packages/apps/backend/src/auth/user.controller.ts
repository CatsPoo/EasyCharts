import {
  Permission,
  User,
  type UserCreate,
  UserCreateSchema,
  type UserUpdate,
  UserUpdateSchema
} from "@easy-charts/easycharts-types";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { JwdAuthGuard } from "./guards/jwtAuth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { UsersService } from "./user.service";
import { RequirePermissions } from "./decorators/permissions.decorator";

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("users")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @RequirePermissions(Permission.USER_MANAGE)
  @Get()
  findAll() {
    return this.userService.getAllUsers();
  }

  @Get("/profile")
  findOne(@Req() req: { user: User }) {
    return this.userService.getUserById(req.user.id);
  }

  @Get("/search")
  search(@Query("q") q: string = "", @Req() req: { user: string }) {
    return this.userService.searchUsers(q, req.user);
  }

  @Get(":id")
  findById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.getUserById(id);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Post()
  @UsePipes(new ZodValidationPipe(UserCreateSchema))
  create(@Body() dto: UserCreate, @Req() req: { user: string }) {
    return this.userService.createUser(dto, req.user);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.removeUser(id);
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Patch(":id")
  async updateChart(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UserUpdateSchema)) body: UserUpdate,
    @Req() req: { user: string }
  ) {
    return this.userService.updateUser(id, body,req.user);
  }
}
