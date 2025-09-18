import {
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
    NotImplementedException,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { UsersService } from "./user.service";

@Controller("users")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UsersController {
  constructor(private readonly userService : UsersService) {}

  @Get()
  findAll() {
    return this.userService.getAllUsers()
  }


  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.getUserById(id)
  }

  @Post()
  @UsePipes(new ZodValidationPipe(UserCreateSchema))
  create(@Body() dto: UserCreate) {
    return this.userService.createUser(dto)
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.removeUser(id)
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(UserUpdateSchema))
  async updateChart(
    @Param("id") id: string,
    @Body() body: UserUpdate,
  ) {
    this.userService.updateUser(id, body);
  }

}
