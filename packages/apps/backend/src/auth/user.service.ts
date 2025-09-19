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
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) {}

  async getAllUsers(): Promise<User[]> {
    return await this.userRepo.find({});
  }

  async getUserById(id: string): Promise<User> {
    const user : UserEntity | null = await this.userRepo.findOne({where:{id}});
    if(!user) throw new NotFoundException("User not found");
    return user
  }

  async getsUerByUsername(username:string) : Promise<User>{
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
     const user = await this.getUserById(userId)
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if(dto.password !== undefined) user.password = dto.password;
    if(dto.permissions !== undefined) user.permissions = dto.permissions


    return await this.userRepo.save(user);
  }

  async removeUser(id: string): Promise<void> {
    const User = await this.userRepo.findOne({ where: { id } });
    if (!User) throw new NotFoundException("User not found");
    await this.userRepo.remove(User); 
  }

}
