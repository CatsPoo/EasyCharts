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

@UseGuards(JwdAuthGuard)
@UseGuards(PermissionsGuard)
@Controller("users")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UsersController {
  constructor(private readonly userService : UsersService) {}


  @RequirePermissions(Permission.USER_MANAGE)
  @Get()
  findAll() {
    return this.userService.getAllUsers()
  }


  @Get("/profile")
  findOne(@Req() req : {user:User}) {
    return this.userService.getUserById(req.user.id)
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Post()
  @UsePipes(new ZodValidationPipe(UserCreateSchema))
  create(@Body() dto: UserCreate) {
    return this.userService.createUser(dto)
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.removeUser(id)
  }

  @RequirePermissions(Permission.USER_MANAGE)
  @Patch(":id")
  @UsePipes(new ZodValidationPipe(UserUpdateSchema))
  async updateChart(
    @Param("id") id: string,
    @Body() body: UserUpdate,
  ) {
    this.userService.updateUser(id, body);
  }

}
