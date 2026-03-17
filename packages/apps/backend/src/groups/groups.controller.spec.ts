import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

const makeGroup = (overrides: Record<string, any> = {}) => ({
  id: 'group-1',
  name: 'Test Group',
  description: 'A test group',
  createdByUserId: 'user-1',
  createdAt: new Date('2025-01-01'),
  memberCount: 0,
  ...overrides,
});

describe('GroupsController', () => {
  let controller: GroupsController;
  let groupsService: jest.Mocked<GroupsService>;

  const mockGroupsService = {
    getAllGroups: jest.fn(),
    getGroupById: jest.fn(),
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    getGroupMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    })
      .overrideGuard(require('../auth/guards/jwtAuth.guard').JwdAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../auth/guards/permissions.guard').PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GroupsController>(GroupsController);
    groupsService = module.get(GroupsService) as jest.Mocked<GroupsService>;
  });

  // ── getAll ───────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('delegates to groupsService.getAllGroups and returns the result', async () => {
      const groups = [makeGroup(), makeGroup({ id: 'group-2', name: 'Beta' })];
      mockGroupsService.getAllGroups.mockResolvedValue(groups);

      const result = await controller.getAll();

      expect(groupsService.getAllGroups).toHaveBeenCalledTimes(1);
      expect(result).toEqual(groups);
    });

    it('returns empty array when no groups exist', async () => {
      mockGroupsService.getAllGroups.mockResolvedValue([]);
      expect(await controller.getAll()).toEqual([]);
    });
  });

  // ── getById ──────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('delegates to groupsService.getGroupById with the id param', async () => {
      const group = makeGroup();
      mockGroupsService.getGroupById.mockResolvedValue(group);

      const result = await controller.getById('group-1');

      expect(groupsService.getGroupById).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(group);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to groupsService.createGroup with dto and requester id', async () => {
      const dto = { name: 'New Group', description: 'desc' };
      const created = makeGroup({ name: 'New Group' });
      mockGroupsService.createGroup.mockResolvedValue(created);

      const result = await controller.create(dto, { user: 'user-1' });

      expect(groupsService.createGroup).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(created);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('delegates to groupsService.updateGroup with id and dto', async () => {
      const dto = { name: 'Updated Name' };
      const updated = makeGroup({ name: 'Updated Name' });
      mockGroupsService.updateGroup.mockResolvedValue(updated);

      const result = await controller.update('group-1', dto);

      expect(groupsService.updateGroup).toHaveBeenCalledWith('group-1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('delegates to groupsService.deleteGroup with id', async () => {
      mockGroupsService.deleteGroup.mockResolvedValue(undefined);

      await controller.delete('group-1');

      expect(groupsService.deleteGroup).toHaveBeenCalledWith('group-1');
    });
  });

  // ── getMembers ───────────────────────────────────────────────────────────────

  describe('getMembers', () => {
    it('delegates to groupsService.getGroupMembers with group id', async () => {
      const members = [
        { id: 'user-1', username: 'alice', displayName: 'Alice' },
        { id: 'user-2', username: 'bob', displayName: 'Bob' },
      ];
      mockGroupsService.getGroupMembers.mockResolvedValue(members);

      const result = await controller.getMembers('group-1');

      expect(groupsService.getGroupMembers).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(members);
    });
  });

  // ── addMember ─────────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('delegates to groupsService.addMember with group id, user id, and requester id', async () => {
      mockGroupsService.addMember.mockResolvedValue(undefined);

      await controller.addMember('group-1', { userId: 'user-2' }, { user: 'admin' });

      expect(groupsService.addMember).toHaveBeenCalledWith('group-1', 'user-2', 'admin');
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('delegates to groupsService.removeMember with group id and user id', async () => {
      mockGroupsService.removeMember.mockResolvedValue(undefined);

      await controller.removeMember('group-1', 'user-1');

      expect(groupsService.removeMember).toHaveBeenCalledWith('group-1', 'user-1');
    });
  });
});
