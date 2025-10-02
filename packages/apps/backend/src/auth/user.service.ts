// src/Users/Users.service.ts
import {
  Permission,
  type User,
  type UserCreate,
  type UserUpdate
} from "@Easy-charts/easycharts-types";
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt';
import { Repository, UpdateResult } from "typeorm";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) {}

  async getAllUsers(): Promise<User[]> {
    const users : UserEntity[]= await this.userRepo.find({});
    return users.map(u=>this.convertUserEntity(u))
  }

  convertUserEntity(userEntity : UserEntity) : User{
    const {password,refreshTokenHash,...safe} = userEntity
    return safe as User
  }
  async getUserById(id: string): Promise<User> {
    const user : UserEntity | null = await this.userRepo.findOne({where:{id}});
    if(!user) throw new NotFoundException("User not found");
    return this.convertUserEntity(user)
  }

  async getsUerWithPasswordByUsername(username:string) : Promise<UserEntity>{
    const user :UserEntity | null = await this.userRepo.findOne({where:{username}})
    if(!user) throw new NotFoundException("User not found");
    return user
  }

  async createUser(dto: UserCreate): Promise<User> {
    const user : UserEntity[] = await this.userRepo.find({where:{username : dto.username}})
    if(user.length > 0) throw new BadRequestException('Username '+dto.username + ' already exists')
    const hasjedPasswordUser : UserCreate = {
        ...dto,
        password: await bcrypt.hash(dto.password, 12)
    }
    return await this.userRepo.save(hasjedPasswordUser);
  }

  async updateUser(userId: string, dto: UserUpdate): Promise<User> {
     const user : UserEntity | null = await this.userRepo.findOne({where:{id:userId}})
     if(!user) throw new NotFoundException("User not found");
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if(dto.password !== undefined) user.password = dto.password;
    if(dto.permissions !== undefined) user.permissions = dto.permissions
    return this.convertUserEntity(await this.userRepo.save(user));
  }

  async removeUser(id: string): Promise<void> {
    const User = await this.userRepo.findOne({ where: { id } });
    if (!User) throw new NotFoundException("User not found");
    await this.userRepo.remove(User); 
  }

  async updateUserRefreshToken(id:string,refreshToken:string|null) : Promise<int>{
    const refreshTokenHash : string = await bcrypt.hash(refreshToken, 12)
    const updateResults :UpdateResult = await this.userRepo.update(id,{refreshTokenHash})
    if(!updateResults || updateResults.affected==0) throw new NotFoundException('User not found')
    return updateResults.affected
  }
}
