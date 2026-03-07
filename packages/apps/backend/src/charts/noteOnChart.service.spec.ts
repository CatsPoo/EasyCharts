import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { NotesOnChartService } from './noteOnChart.service';
import { NoteOnChartEntity } from './entities/noteOnChart.entity';

const makeNoteEntity = (overrides: Partial<NoteOnChartEntity> = {}): NoteOnChartEntity =>
  ({
    id: 'note-1',
    chartId: 'chart-1',
    content: 'Hello',
    color: '#fff',
    position: { x: 10, y: 20 },
    width: 200,
    height: 100,
    ...overrides,
  } as NoteOnChartEntity);

describe('NotesOnChartService', () => {
  let service: NotesOnChartService;

  const qbMock = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const repoMock = {
    upsert: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const managerMock = {
    getRepository: jest.fn(() => repoMock),
  } as unknown as EntityManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesOnChartService],
    }).compile();

    service = module.get<NotesOnChartService>(NotesOnChartService);
  });

  // ── convertNoteOnChartEntity ───────────────────────────────────────────────

  describe('convertNoteOnChartEntity', () => {
    it('maps entity fields to NoteOnChart shape', () => {
      const entity = makeNoteEntity();
      const result = service.convertNoteOnChartEntity(entity);

      expect(result.id).toBe('note-1');
      expect(result.content).toBe('Hello');
      expect(result.color).toBe('#fff');
      expect(result.position).toEqual({ x: 10, y: 20 });
      expect(result.size).toEqual({ width: 200, height: 100 });
    });
  });

  // ── syncNotes ──────────────────────────────────────────────────────────────

  describe('syncNotes', () => {
    it('upserts notes and deletes non-kept notes when array is non-empty', async () => {
      const notes = [
        {
          id: 'note-1',
          content: 'Hello',
          color: '#fff',
          position: { x: 10, y: 20 },
          size: { width: 200, height: 100 },
        },
      ] as any[];

      await service.syncNotes(managerMock, 'chart-1', notes);

      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'note-1', chartId: 'chart-1' }),
        ]),
        expect.objectContaining({ conflictPaths: ['id'] }),
      );
      expect(qbMock.execute).toHaveBeenCalled();
    });

    it('passes correct position and size fields to upsert', async () => {
      const notes = [
        {
          id: 'note-2',
          content: 'World',
          color: '#000',
          position: { x: 5, y: 15 },
          size: { width: 300, height: 150 },
        },
      ] as any[];

      await service.syncNotes(managerMock, 'chart-1', notes);

      const upsertArg = repoMock.upsert.mock.calls[0][0][0];
      expect(upsertArg.width).toBe(300);
      expect(upsertArg.height).toBe(150);
      expect(upsertArg.position).toEqual({ x: 5, y: 15 });
    });

    it('deletes all notes for chart when notes array is empty', async () => {
      await service.syncNotes(managerMock, 'chart-1', []);

      expect(repoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      expect(repoMock.upsert).not.toHaveBeenCalled();
    });

    it('does not call delete-all when notes are present', async () => {
      const notes = [
        {
          id: 'note-1',
          content: 'x',
          color: '#fff',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
        },
      ] as any[];

      await service.syncNotes(managerMock, 'chart-1', notes);

      expect(repoMock.delete).not.toHaveBeenCalledWith({ chartId: 'chart-1' });
    });
  });
});
