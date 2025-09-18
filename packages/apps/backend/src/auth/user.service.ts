// src/Users/Users.service.ts
import {
    type User,
    type UserCreate,
    type UserUpdate
} from "@Easy-charts/easycharts-types";
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";
import * as bcrypt from 'bcrypt';

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

  //TODO Add lines to create dto
  async createUser(dto: UserCreate): Promise<User> {
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
