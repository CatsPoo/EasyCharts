import type { CreateGroup, Group, UpdateGroup } from "@easy-charts/easycharts-types";
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupEntity } from "./entities/group.entity";
import { GroupMembershipEntity } from "./entities/groupMembership.entity";
import { UserEntity } from "../auth/entities/user.entity";

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(GroupMembershipEntity)
    private readonly membershipRepo: Repository<GroupMembershipEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private async toGroup(entity: GroupEntity): Promise<Group> {
    const memberCount = await this.membershipRepo.count({ where: { groupId: entity.id } });
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdByUserId: entity.createdByUserId,
      createdAt: entity.createdAt,
      memberCount,
    };
  }

  async getAllGroups(): Promise<Group[]> {
    const groups = await this.groupRepo.find({ order: { name: "ASC" } });
    return Promise.all(groups.map(g => this.toGroup(g)));
  }

  async getGroupById(id: string): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return this.toGroup(group);
  }

  async createGroup(dto: CreateGroup, createdByUserId: string): Promise<Group> {
    const existing = await this.groupRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Group with name "${dto.name}" already exists`);
    const entity = this.groupRepo.create({ ...dto, createdByUserId });
    const saved = await this.groupRepo.save(entity);
    this.logger.log(`Group "${dto.name}" created by userId "${createdByUserId}"`);
    return this.toGroup(saved);
  }

  async updateGroup(id: string, dto: UpdateGroup): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupRepo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Group with name "${dto.name}" already exists`);
      group.name = dto.name;
    }
    if (dto.description !== undefined) group.description = dto.description;
    const saved = await this.groupRepo.save(group);
    return this.toGroup(saved);
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    await this.groupRepo.delete({ id });
    this.logger.log(`Group "${group.name}" (${id}) deleted`);
  }

  // ─── Members ────────────────────────────────────────────────────────────────

  async getGroupMembers(groupId: string): Promise<{ id: string; username: string; displayName: string }[]> {
    await this.getGroupById(groupId);
    const memberships = await this.membershipRepo.find({ where: { groupId } });
    const userIds = memberships.map(m => m.userId);
    if (userIds.length === 0) return [];
    const users = await this.userRepo.findByIds(userIds);
    return users.map(u => ({ id: u.id, username: u.username, displayName: u.displayName }));
  }

  async addMember(groupId: string, userId: string, addedByUserId: string): Promise<void> {
    await this.getGroupById(groupId);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const existing = await this.membershipRepo.findOne({ where: { groupId, userId } });
    if (existing) throw new ConflictException("User is already a member of this group");
    await this.membershipRepo.save({ groupId, userId, addedByUserId });
    this.logger.log(`User "${userId}" added to group "${groupId}" by "${addedByUserId}"`);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const result = await this.membershipRepo.delete({ groupId, userId });
    if (!result.affected) throw new NotFoundException("Membership not found");
    this.logger.log(`User "${userId}" removed from group "${groupId}"`);
  }

  /** Returns all group IDs the user belongs to */
  async getUserGroupIds(userId: string): Promise<string[]> {
    const memberships = await this.membershipRepo.find({ where: { userId }, select: ["groupId"] });
    return memberships.map(m => m.groupId);
  }
}
