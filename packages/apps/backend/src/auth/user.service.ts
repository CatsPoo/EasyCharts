// src/Users/Users.service.ts
import {
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
import { ILike, Repository, UpdateResult } from "typeorm";
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

  async searchUsers(q: string, excludeId?: string): Promise<User[]> {
    const like = `%${q}%`;
    let users = await this.userRepo.find({
      where: [{ username: ILike(like) }, { displayName: ILike(like) }],
      order: { username: "ASC" },
      take: 20,
    });
    if (excludeId) users = users.filter(u => u.id !== excludeId);
    return users.map(u => this.convertUserEntity(u));
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

  async getUserWithPasswordByUsername(username:string) : Promise<UserEntity>{
    const user :UserEntity | null = await this.userRepo.findOne({where:{username}})
    if(!user) throw new NotFoundException("User not found");
    return user
  }

  /** @deprecated use getUserWithPasswordByUsername */
  async getsUerWithPasswordByUsername(username:string) : Promise<UserEntity>{
    return this.getUserWithPasswordByUsername(username);
  }

  async getUserEntityById(id: string): Promise<UserEntity> {
    const user : UserEntity | null = await this.userRepo.findOne({where:{id}});
    if(!user) throw new NotFoundException("User not found");
    return user;
  }

  async createUser(dto: UserCreate,createdByUserId:string): Promise<User> {
    const user : UserEntity[] = await this.userRepo.find({where:{username : dto.username}})
    if(user.length > 0) throw new BadRequestException('Username '+dto.username + ' already exists')
    const hasjedPasswordUser : UserCreate = {
        ...dto,
        password: await bcrypt.hash(dto.password, 12)
    }
    return await this.userRepo.save({...hasjedPasswordUser,createdByUserId});
  }

  async updateUser(userId: string, dto: UserUpdate,updatedByUserId:string): Promise<User> {
     const user : UserEntity | null = await this.userRepo.findOne({where:{id:userId}})
     if(!user) throw new NotFoundException("User not found");
     user.updatedByUserId = updatedByUserId
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if(dto.password !== undefined) user.password = await bcrypt.hash(dto.password, 12);
    if(dto.permissions !== undefined) user.permissions = dto.permissions
    return this.convertUserEntity(await this.userRepo.save(user));
  }

  async removeUser(id: string): Promise<void> {
    const User = await this.userRepo.findOne({ where: { id } });
    if (!User) throw new NotFoundException("User not found");
    await this.userRepo.remove(User); 
  }

  async updateUserRefreshToken(id:string,refreshToken:string|null) : Promise<number>{
    const refreshTokenHash : string | null = refreshToken ? await bcrypt.hash(refreshToken, 12) : null
    const updateResults :UpdateResult = await this.userRepo.update(id,{refreshTokenHash})
    if(!updateResults || updateResults.affected==0) throw new NotFoundException('User not found')
    return updateResults.affected ?? 0
  }
}
