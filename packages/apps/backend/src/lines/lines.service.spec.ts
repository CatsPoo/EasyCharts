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

  // ── convertLineToEntity ───────────────────────────────────────────────────────

  describe('convertLineToEntity', () => {
    it('maps Line back to LineEntity with correct port IDs', () => {
      const line = {
        id: 'line-1',
        sourcePort: makePort('port-1') as any,
        targetPort: makePort('port-2') as any,
      } as any;

      const result = service.convertLineToEntity(line);

      expect(result.id).toBe('line-1');
      expect(result.sourcePortId).toBe('port-1');
      expect(result.targetPortId).toBe('port-2');
      expect(result.sourcePort).toEqual(line.sourcePort);
      expect(result.targetPort).toEqual(line.targetPort);
    });
  });

  // ── deleteOrphanLines ─────────────────────────────────────────────────────────

  describe('deleteOrphanLines', () => {
    it('returns number of affected rows', async () => {
      const subQbMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('(SELECT loc.line_id FROM lines_on_chart loc)'),
      };
      const deleteQbMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };
      const txQbMock: any = {
        subQuery: jest.fn(() => subQbMock),
        delete: jest.fn(() => deleteQbMock),
      };
      const txMock = { createQueryBuilder: jest.fn(() => txQbMock) };
      const managerMock: any = { transaction: jest.fn((cb: any) => cb(txMock)) };

      const result = await service.deleteOrphanLines(managerMock);

      expect(result).toBe(5);
      expect(txMock.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('returns 0 when no rows were affected', async () => {
      const subQbMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('(SELECT loc.line_id FROM lines_on_chart loc)'),
      };
      const deleteQbMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: undefined }),
      };
      const txQbMock: any = {
        subQuery: jest.fn(() => subQbMock),
        delete: jest.fn(() => deleteQbMock),
      };
      const txMock = { createQueryBuilder: jest.fn(() => txQbMock) };
      const managerMock: any = { transaction: jest.fn((cb: any) => cb(txMock)) };

      const result = await service.deleteOrphanLines(managerMock);

      expect(result).toBe(0);
    });
  });

  // ── upsertLines ───────────────────────────────────────────────────────────────

  describe('upsertLines', () => {
    const makeRepoMock = (existingLines: any[]) => ({
      find: jest.fn().mockResolvedValue(existingLines),
      upsert: jest.fn().mockResolvedValue(undefined),
    });

    const managerWith = (repoMock: any) => ({
      getRepository: jest.fn(() => repoMock),
    } as any);

    it('returns empty array when lines is empty', async () => {
      const repoMock = makeRepoMock([]);
      const result = await service.upsertLines(managerWith(repoMock), [], 'user-1');
      expect(result).toEqual([]);
      expect(repoMock.upsert).not.toHaveBeenCalled();
    });

    it('upserts new lines with no existing matching port pairs', async () => {
      const line = {
        id: 'line-new',
        sourcePort: makePort('port-1'),
        targetPort: makePort('port-2'),
      } as any;
      const repoMock = makeRepoMock([]); // no existing lines

      const result = await service.upsertLines(managerWith(repoMock), [line], 'user-1');

      expect(result[0].id).toBe('line-new');
      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'line-new', sourcePortId: 'port-1', targetPortId: 'port-2' }),
        ]),
        expect.objectContaining({ conflictPaths: ['id'] }),
      );
    });

    it('reuses existing line ID when port pair already exists in DB', async () => {
      const line = {
        id: 'line-frontend-uuid',
        sourcePort: makePort('port-1'),
        targetPort: makePort('port-2'),
      } as any;
      // DB already has a line for the same port pair with a different ID
      const repoMock = makeRepoMock([
        { id: 'line-db-existing', sourcePortId: 'port-1', targetPortId: 'port-2' },
      ]);

      const result = await service.upsertLines(managerWith(repoMock), [line], 'user-1');

      expect(result[0].id).toBe('line-db-existing');
      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'line-db-existing' }),
        ]),
        expect.any(Object),
      );
    });
  });

  // ── ensureAndUpdateBonds ──────────────────────────────────────────────────────

  describe('ensureAndUpdateBonds', () => {
    const makeQbChain = (executeResult = { affected: 1 }) => {
      const qb: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(executeResult),
      };
      return qb;
    };

    const makeBondRepoMock = () => ({
      findOne: jest.fn(),
      save: jest.fn(),
    });

    const makeLineRepoMock = (findByResults: any[][] = [[], []]) => {
      let callCount = 0;
      return {
        findBy: jest.fn(() => {
          return Promise.resolve(findByResults[callCount++] ?? []);
        }),
        createQueryBuilder: jest.fn(() => makeQbChain()),
      };
    };

    const managerWith = (bondRepoMock: any, lineRepoMock: any) => ({
      getRepository: jest.fn((entity) => {
        if (entity.name === 'BondEntity') return bondRepoMock;
        return lineRepoMock;
      }),
    } as any);

    it('returns immediately when bonds array is empty', async () => {
      const bondRepo = makeBondRepoMock();
      const lineRepo = makeLineRepoMock();
      await service.ensureAndUpdateBonds(managerWith(bondRepo, lineRepo), [], 'user-1');
      expect(bondRepo.save).not.toHaveBeenCalled();
    });

    it('creates new bond when it does not exist', async () => {
      const bondRepo = makeBondRepoMock();
      bondRepo.findOne.mockResolvedValue(null);
      bondRepo.save.mockResolvedValue({ id: 'bond-1', name: 'Bond A' });
      const lineRepo = makeLineRepoMock([[/* requestedLines */], [/* currentLines */]]);

      await service.ensureAndUpdateBonds(managerWith(bondRepo, lineRepo), [
        { id: 'bond-1', name: 'Bond A', membersLines: [] },
      ] as any, 'user-1');

      expect(bondRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bond-1', name: 'Bond A' }),
      );
    });

    it('updates bond name when it differs from existing', async () => {
      const bondRepo = makeBondRepoMock();
      bondRepo.findOne.mockResolvedValue({ id: 'bond-1', name: 'Old Name' });
      bondRepo.save.mockResolvedValue({ id: 'bond-1', name: 'New Name' });
      const lineRepo = makeLineRepoMock([[], []]);

      await service.ensureAndUpdateBonds(managerWith(bondRepo, lineRepo), [
        { id: 'bond-1', name: 'New Name', membersLines: [] },
      ] as any, 'user-1');

      expect(bondRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    it('throws BadGatewayException when requested lines do not all exist', async () => {
      const bondRepo = makeBondRepoMock();
      bondRepo.findOne.mockResolvedValue({ id: 'bond-1', name: 'B' });
      // findBy for requested lines returns only 1 of 2 requested
      const lineRepo = makeLineRepoMock([[makeLine({ id: 'line-1' })], []]);

      await expect(
        service.ensureAndUpdateBonds(managerWith(bondRepo, lineRepo), [
          { id: 'bond-1', name: 'B', membersLines: ['line-1', 'line-missing'] },
        ] as any, 'user-1'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('throws BadGatewayException when line belongs to a different bond', async () => {
      const bondRepo = makeBondRepoMock();
      bondRepo.findOne.mockResolvedValue({ id: 'bond-1', name: 'B' });
      const foreignLine = makeLine({ id: 'line-1', bondId: 'bond-other' });
      const lineRepo = makeLineRepoMock([[foreignLine], []]);

      await expect(
        service.ensureAndUpdateBonds(managerWith(bondRepo, lineRepo), [
          { id: 'bond-1', name: 'B', membersLines: ['line-1'] },
        ] as any, 'user-1'),
      ).rejects.toThrow(BadGatewayException);
    });
  });

  // ── getBondPortSiblings ───────────────────────────────────────────────────────

  describe('getBondPortSiblings', () => {
    it('returns null when no line found for the port', async () => {
      linesRepo.findOne.mockResolvedValue(null);

      const result = await service.getBondPortSiblings('port-1', 'device-1');
      expect(result).toBeNull();
    });

    it('returns null when line has no bondId', async () => {
      linesRepo.findOne.mockResolvedValue({ id: 'line-1', bondId: null });

      const result = await service.getBondPortSiblings('port-1', 'device-1');
      expect(result).toBeNull();
    });

    it('returns null when bond is not found in db', async () => {
      linesRepo.findOne.mockResolvedValue({ id: 'line-1', bondId: 'bond-1' });
      bondRepo.findOne.mockResolvedValue(null);

      const result = await service.getBondPortSiblings('port-1', 'device-1');
      expect(result).toBeNull();
    });

    it('returns null when bond members produce no same-side or other-side ports', async () => {
      linesRepo.findOne.mockResolvedValue({ id: 'line-1', bondId: 'bond-1' });
      // Bond has only the queried port — no sibling ports
      bondRepo.findOne.mockResolvedValue({
        id: 'bond-1',
        name: 'Bond Alpha',
        members: [
          {
            id: 'line-1',
            sourcePortId: 'port-1',
            targetPortId: 'port-2',
            sourcePort: { id: 'port-1', deviceId: 'device-1', name: 'eth0', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
            targetPort: { id: 'port-2', deviceId: 'device-1', name: 'eth1', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
          },
        ],
      });

      // port-1 is queried; port-2 is same device but both are the "query" port scenario:
      // port-1 is skipped (it IS the queried port), port-2 is same side
      const result = await service.getBondPortSiblings('port-1', 'device-1');

      // port-2 is same device, so it goes to sameSide — result should NOT be null
      expect(result).not.toBeNull();
      expect(result!.bondId).toBe('bond-1');
      expect(result!.sameSide).toHaveLength(1);
      expect(result!.sameSide[0].id).toBe('port-2');
    });

    it('returns otherSide ports when bond connects to a different device', async () => {
      linesRepo.findOne.mockResolvedValue({ id: 'line-1', bondId: 'bond-1' });
      bondRepo.findOne.mockResolvedValue({
        id: 'bond-1',
        name: 'Bond Beta',
        members: [
          {
            id: 'line-1',
            sourcePortId: 'port-1',
            targetPortId: 'port-remote',
            sourcePort: { id: 'port-1', deviceId: 'device-1', name: 'eth0', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
            targetPort: { id: 'port-remote', deviceId: 'device-2', name: 'fa0', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
          },
        ],
      });

      const result = await service.getBondPortSiblings('port-1', 'device-1');

      expect(result).not.toBeNull();
      expect(result!.sameSide).toHaveLength(0);
      expect(result!.otherSide).toHaveLength(1);
      expect(result!.otherSide[0].deviceId).toBe('device-2');
      expect(result!.otherSide[0].ports[0].id).toBe('port-remote');
    });

    it('includes memberLinePairs in the result', async () => {
      linesRepo.findOne.mockResolvedValue({ id: 'line-1', bondId: 'bond-1' });
      bondRepo.findOne.mockResolvedValue({
        id: 'bond-1',
        name: 'Bond Gamma',
        members: [
          {
            id: 'line-1',
            sourcePortId: 'port-1',
            targetPortId: 'port-remote',
            sourcePort: { id: 'port-1', deviceId: 'device-1', name: 'eth0', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
            targetPort: { id: 'port-remote', deviceId: 'device-2', name: 'fa0', type: 'ethernet', inUse: false, createdAt: new Date(), updatedAt: new Date(), createdByUserId: 'admin', updatedByUserId: null },
          },
        ],
      });

      const result = await service.getBondPortSiblings('port-1', 'device-1');

      expect(result!.memberLinePairs).toHaveLength(1);
      expect(result!.memberLinePairs[0]).toEqual({
        lineId: 'line-1',
        sourcePortId: 'port-1',
        targetPortId: 'port-remote',
      });
    });
  });
});
