import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LineEntity } from './entities/line.entity';
import { BondEntity } from './entities/bond.entity';
import { LinessService } from './lines.service';

const makePort = (id: string, deviceId = 'device-1') => ({
  id,
  name: `port-${id}`,
  deviceId,
  type: 'ethernet' as any,
  inUse: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  createdByUserId: 'admin',
  updatedByUserId: null,
});

const makeLine = (overrides: Partial<LineEntity> = {}): LineEntity =>
  ({
    id: 'line-1',
    sourcePortId: 'port-1',
    targetPortId: 'port-2',
    bondId: null,
    sourcePort: makePort('port-1') as any,
    targetPort: makePort('port-2') as any,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as LineEntity);

const makeBond = (overrides: Partial<BondEntity> = {}): BondEntity =>
  ({
    id: 'bond-1',
    name: 'Bond Alpha',
    members: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as BondEntity);

describe('LinessService', () => {
  let service: LinessService;
  let linesRepo: jest.Mocked<any>;
  let bondRepo: jest.Mocked<any>;

  // Minimal query builder chain used by updateBond
  const makeQb = (executeResult = { affected: 1 }) => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(executeResult),
  });

  const mockLinesRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    manager: {},
    createQueryBuilder: jest.fn(() => makeQb()),
  };

  const mockBondRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinessService,
        { provide: getRepositoryToken(LineEntity), useValue: mockLinesRepo },
        { provide: getRepositoryToken(BondEntity), useValue: mockBondRepo },
      ],
    }).compile();

    service = module.get<LinessService>(LinessService);
    linesRepo = module.get(getRepositoryToken(LineEntity));
    bondRepo = module.get(getRepositoryToken(BondEntity));
  });

  // ── convertLineEntity ────────────────────────────────────────────────────────

  describe('convertLineEntity', () => {
    it('returns a Line object with all entity fields', () => {
      const entity = makeLine();
      const result = service.convertLineEntity(entity);
      expect(result.id).toBe('line-1');
      expect(result.sourcePortId).toBe('port-1');
      expect(result.targetPortId).toBe('port-2');
    });
  });

  // ── getConnectedPortIdMap ────────────────────────────────────────────────────

  describe('getConnectedPortIdMap', () => {
    it('returns empty map for empty portIds', async () => {
      const result = await service.getConnectedPortIdMap([]);
      expect(result.size).toBe(0);
      expect(linesRepo.find).not.toHaveBeenCalled();
    });

    it('maps source port to target and target to source', async () => {
      linesRepo.find.mockResolvedValue([makeLine()]);

      const result = await service.getConnectedPortIdMap(['port-1', 'port-2']);

      expect(result.get('port-1')).toBe('port-2');
      expect(result.get('port-2')).toBe('port-1');
    });

    it('only maps ports that are in the provided list', async () => {
      linesRepo.find.mockResolvedValue([makeLine()]);

      // Only ask about port-1
      const result = await service.getConnectedPortIdMap(['port-1']);

      expect(result.get('port-1')).toBe('port-2');
      expect(result.has('port-2')).toBe(false);
    });
  });

  // ── convertBondEntitytoBond ──────────────────────────────────────────────────

  describe('convertBondEntitytoBond', () => {
    it('converts entity with members array', () => {
      const bond = makeBond({ members: [makeLine({ id: 'line-1' })] as any });
      const result = service.convertBondEntitytoBond(bond);
      expect(result.id).toBe('bond-1');
      expect(result.membersLines).toEqual(['line-1']);
    });

    it('returns empty membersLines when members is undefined', () => {
      const bond = makeBond({ members: undefined as any });
      const result = service.convertBondEntitytoBond(bond);
      expect(result.membersLines).toEqual([]);
    });
  });

  // ── createEmptyBond ──────────────────────────────────────────────────────────

  describe('createEmptyBond', () => {
    it('saves new bond and returns converted entity', async () => {
      const bondEntity = makeBond();
      bondRepo.save.mockResolvedValue(bondEntity);

      const result = await service.createEmptyBond({ id: 'bond-1', name: 'Bond Alpha' }, 'admin');

      expect(bondRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bond-1', name: 'Bond Alpha' }),
      );
      expect(result.id).toBe('bond-1');
    });
  });

  // ── getBondById ───────────────────────────────────────────────────────────────

  describe('getBondById', () => {
    it('returns bond when found', async () => {
      bondRepo.findOne.mockResolvedValue(makeBond({ members: [] }));

      const result = await service.getBondById('bond-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('bond-1');
    });

    it('returns null when bond does not exist', async () => {
      bondRepo.findOne.mockResolvedValue(null);

      const result = await service.getBondById('missing');
      expect(result).toBeNull();
    });
  });

  // ── updateBond ────────────────────────────────────────────────────────────────

  describe('updateBond', () => {
    it('throws NotFoundException when bond does not exist', async () => {
      bondRepo.findOne.mockResolvedValue(null);

      await expect(service.updateBond('missing', {}, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('updates bond name', async () => {
      const bond = makeBond({ members: [] });
      bondRepo.findOne
        .mockResolvedValueOnce(bond) // initial fetch
        .mockResolvedValueOnce({ ...bond, name: 'New Name', members: [] }); // reload
      bondRepo.save.mockResolvedValue({ ...bond, name: 'New Name' });

      const result = await service.updateBond('bond-1', { name: 'New Name' }, 'admin');

      expect(bondRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });

    it('throws BadGatewayException when requested member lines do not exist', async () => {
      const bond = makeBond({ members: [] });
      bondRepo.findOne.mockResolvedValue(bond);
      // 2 ids requested but only 1 found
      linesRepo.findBy
        .mockResolvedValueOnce([makeLine()]) // requestedLines
        .mockResolvedValueOnce([]); // currentLines

      await expect(
        service.updateBond('bond-1', { membersLines: ['line-1', 'line-missing'] }, 'admin'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('throws BadGatewayException when a line already belongs to another bond', async () => {
      const bond = makeBond({ members: [] });
      bondRepo.findOne.mockResolvedValue(bond);
      const foreignLine = makeLine({ id: 'line-1', bondId: 'bond-other' });
      linesRepo.findBy
        .mockResolvedValueOnce([foreignLine]) // requestedLines (length matches)
        .mockResolvedValueOnce([]); // currentLines

      await expect(
        service.updateBond('bond-1', { membersLines: ['line-1'] }, 'admin'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('adds new members and removes old ones', async () => {
      const bond = makeBond({ members: [] });
      bondRepo.findOne
        .mockResolvedValueOnce(bond) // initial fetch
        .mockResolvedValueOnce({ ...bond, members: [makeLine({ id: 'line-2' })] }); // reload

      // requestedLines: line-2 (new)
      // currentLines: line-1 (to be removed)
      linesRepo.findBy
        .mockResolvedValueOnce([makeLine({ id: 'line-2', bondId: null })]) // requested
        .mockResolvedValueOnce([makeLine({ id: 'line-1', bondId: 'bond-1' })]); // current

      const qb = makeQb();
      linesRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.updateBond('bond-1', { membersLines: ['line-2'] }, 'admin');

      // Both add and remove should call query builder
      expect(linesRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result.membersLines).toContain('line-2');
    });
  });

  // ── deleteBond ────────────────────────────────────────────────────────────────

  describe('deleteBond', () => {
    it('calls bondRepo.delete with bond id', () => {
      bondRepo.delete.mockResolvedValue({ affected: 1 });

      service.deleteBond('bond-1');

      expect(bondRepo.delete).toHaveBeenCalledWith('bond-1');
    });
  });

  // ── getConnectedPortInfo ──────────────────────────────────────────────────────

  describe('getConnectedPortInfo', () => {
    it('returns the other port connected to given port', async () => {
      const line = makeLine({
        sourcePortId: 'port-1',
        targetPortId: 'port-2',
        sourcePort: makePort('port-1') as any,
        targetPort: makePort('port-2') as any,
      });
      linesRepo.findOne.mockResolvedValue(line);

      const result = await service.getConnectedPortInfo('port-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('port-2');
    });

    it('returns null when no line connects this port', async () => {
      linesRepo.findOne.mockResolvedValue(null);

      const result = await service.getConnectedPortInfo('port-orphan');
      expect(result).toBeNull();
    });
  });
});
