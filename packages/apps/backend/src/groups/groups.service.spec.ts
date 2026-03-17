import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { GroupEntity } from './entities/group.entity';
import { GroupMembershipEntity } from './entities/groupMembership.entity';
import { GroupsService } from './groups.service';

const makeGroupEntity = (overrides: Partial<GroupEntity> = {}): GroupEntity =>
  ({
    id: 'group-1',
    name: 'Test Group',
    description: 'A test group',
    createdByUserId: 'user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as GroupEntity);

const makeUserEntity = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    ...overrides,
  } as UserEntity);

const makeMembershipEntity = (overrides: Partial<GroupMembershipEntity> = {}): GroupMembershipEntity =>
  ({
    groupId: 'group-1',
    userId: 'user-1',
    addedByUserId: 'admin',
    addedAt: new Date('2025-01-01'),
    ...overrides,
  } as GroupMembershipEntity);

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepo: jest.Mocked<any>;
  let membershipRepo: jest.Mocked<any>;
  let userRepo: jest.Mocked<any>;

  const mockGroupRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockMembershipRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(GroupEntity), useValue: mockGroupRepo },
        { provide: getRepositoryToken(GroupMembershipEntity), useValue: mockMembershipRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupRepo = module.get(getRepositoryToken(GroupEntity));
    membershipRepo = module.get(getRepositoryToken(GroupMembershipEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
  });

  // ── getAllGroups ─────────────────────────────────────────────────────────────

  describe('getAllGroups', () => {
    it('returns all groups ordered by name with member counts', async () => {
      mockGroupRepo.find.mockResolvedValue([
        makeGroupEntity({ id: 'group-1', name: 'Alpha' }),
        makeGroupEntity({ id: 'group-2', name: 'Beta' }),
      ]);
      mockMembershipRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

      const result = await service.getAllGroups();

      expect(groupRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alpha');
      expect(result[0].memberCount).toBe(3);
      expect(result[1].memberCount).toBe(1);
    });

    it('returns empty array when no groups exist', async () => {
      mockGroupRepo.find.mockResolvedValue([]);
      expect(await service.getAllGroups()).toEqual([]);
    });
  });

  // ── getGroupById ─────────────────────────────────────────────────────────────

  describe('getGroupById', () => {
    it('returns group with member count when found', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(2);

      const result = await service.getGroupById('group-1');

      expect(groupRepo.findOne).toHaveBeenCalledWith({ where: { id: 'group-1' } });
      expect(result.id).toBe('group-1');
      expect(result.memberCount).toBe(2);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      await expect(service.getGroupById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── createGroup ──────────────────────────────────────────────────────────────

  describe('createGroup', () => {
    const dto = { name: 'New Group', description: 'A new group' };

    it('creates and returns group when name is unique', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      const created = makeGroupEntity({ name: 'New Group' });
      mockGroupRepo.create.mockReturnValue(created);
      mockGroupRepo.save.mockResolvedValue(created);
      mockMembershipRepo.count.mockResolvedValue(0);

      const result = await service.createGroup(dto, 'user-1');

      expect(groupRepo.findOne).toHaveBeenCalledWith({ where: { name: 'New Group' } });
      expect(groupRepo.create).toHaveBeenCalledWith({ ...dto, createdByUserId: 'user-1' });
      expect(result.name).toBe('New Group');
      expect(result.memberCount).toBe(0);
    });

    it('throws ConflictException when group name already exists', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      await expect(service.createGroup(dto, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── updateGroup ──────────────────────────────────────────────────────────────

  describe('updateGroup', () => {
    it('updates name when new name is unique', async () => {
      const group = makeGroupEntity({ name: 'Old Name' });
      mockGroupRepo.findOne
        .mockResolvedValueOnce(group)   // fetch group by id
        .mockResolvedValueOnce(null);   // name conflict check — no conflict
      const saved = { ...group, name: 'New Name' };
      mockGroupRepo.save.mockResolvedValue(saved);
      mockMembershipRepo.count.mockResolvedValue(0);

      const result = await service.updateGroup('group-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('throws ConflictException when new name is already taken by another group', async () => {
      const group = makeGroupEntity({ name: 'Old Name' });
      mockGroupRepo.findOne
        .mockResolvedValueOnce(group)
        .mockResolvedValueOnce(makeGroupEntity({ id: 'group-other', name: 'Taken Name' }));

      await expect(service.updateGroup('group-1', { name: 'Taken Name' })).rejects.toThrow(ConflictException);
    });

    it('updates description without triggering name conflict check', async () => {
      const group = makeGroupEntity({ description: 'old desc' });
      mockGroupRepo.findOne.mockResolvedValue(group);
      const saved = { ...group, description: 'new desc' };
      mockGroupRepo.save.mockResolvedValue(saved);
      mockMembershipRepo.count.mockResolvedValue(0);

      const result = await service.updateGroup('group-1', { description: 'new desc' });

      // findOne called only once (to fetch group), not for name conflict
      expect(groupRepo.findOne).toHaveBeenCalledTimes(1);
      expect(result.description).toBe('new desc');
    });

    it('does not check name conflict when name is unchanged', async () => {
      const group = makeGroupEntity({ name: 'Same Name' });
      mockGroupRepo.findOne.mockResolvedValue(group);
      mockGroupRepo.save.mockResolvedValue(group);
      mockMembershipRepo.count.mockResolvedValue(0);

      await service.updateGroup('group-1', { name: 'Same Name' });

      expect(groupRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      await expect(service.updateGroup('nonexistent', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteGroup ──────────────────────────────────────────────────────────────

  describe('deleteGroup', () => {
    it('deletes group when found', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockGroupRepo.delete.mockResolvedValue({ affected: 1 });

      await service.deleteGroup('group-1');

      expect(groupRepo.delete).toHaveBeenCalledWith({ id: 'group-1' });
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteGroup('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getGroupMembers ──────────────────────────────────────────────────────────

  describe('getGroupMembers', () => {
    it('returns members of the group', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(2);
      mockMembershipRepo.find.mockResolvedValue([
        makeMembershipEntity({ userId: 'user-1' }),
        makeMembershipEntity({ userId: 'user-2' }),
      ]);
      mockUserRepo.findByIds.mockResolvedValue([
        makeUserEntity({ id: 'user-1', username: 'alice', displayName: 'Alice' }),
        makeUserEntity({ id: 'user-2', username: 'bob', displayName: 'Bob' }),
      ]);

      const result = await service.getGroupMembers('group-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'user-1', username: 'alice', displayName: 'Alice' });
      expect(result[1]).toEqual({ id: 'user-2', username: 'bob', displayName: 'Bob' });
    });

    it('returns empty array when group has no members', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(0);
      mockMembershipRepo.find.mockResolvedValue([]);

      const result = await service.getGroupMembers('group-1');

      expect(result).toEqual([]);
      expect(userRepo.findByIds).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      await expect(service.getGroupMembers('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── addMember ────────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('adds member when group and user exist and user is not already a member', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(0);
      mockUserRepo.findOne.mockResolvedValue(makeUserEntity());
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.save.mockResolvedValue({});

      await service.addMember('group-1', 'user-1', 'admin');

      expect(membershipRepo.save).toHaveBeenCalledWith({
        groupId: 'group-1',
        userId: 'user-1',
        addedByUserId: 'admin',
      });
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember('bad-group', 'user-1', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(0);
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember('group-1', 'bad-user', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user is already a member', async () => {
      mockGroupRepo.findOne.mockResolvedValue(makeGroupEntity());
      mockMembershipRepo.count.mockResolvedValue(1);
      mockUserRepo.findOne.mockResolvedValue(makeUserEntity());
      mockMembershipRepo.findOne.mockResolvedValue(makeMembershipEntity());
      await expect(service.addMember('group-1', 'user-1', 'admin')).rejects.toThrow(ConflictException);
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('removes membership when it exists', async () => {
      mockMembershipRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeMember('group-1', 'user-1');

      expect(membershipRepo.delete).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'user-1' });
    });

    it('throws NotFoundException when membership does not exist', async () => {
      mockMembershipRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeMember('group-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getUserGroupIds ──────────────────────────────────────────────────────────

  describe('getUserGroupIds', () => {
    it('returns group ids the user belongs to', async () => {
      mockMembershipRepo.find.mockResolvedValue([
        makeMembershipEntity({ groupId: 'group-1' }),
        makeMembershipEntity({ groupId: 'group-2' }),
      ]);

      const result = await service.getUserGroupIds('user-1');

      expect(membershipRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: ['groupId'],
      });
      expect(result).toEqual(['group-1', 'group-2']);
    });

    it('returns empty array when user has no groups', async () => {
      mockMembershipRepo.find.mockResolvedValue([]);
      expect(await service.getUserGroupIds('user-1')).toEqual([]);
    });
  });
});
