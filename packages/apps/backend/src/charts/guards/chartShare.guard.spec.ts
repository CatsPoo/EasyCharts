import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChartShareGuard } from './chartShare.guard';
import { CHART_PRIVILEGE_KEY } from '../decorators/requireChartPrivilege.decorator';

const mockReflector = { getAllAndOverride: jest.fn() };
const mockChartRepo = { findOne: jest.fn() };
const mockChartShareRepo = { findOne: jest.fn() };

function makeCtx(params: Record<string, string>, userId: string | undefined) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: userId, params }),
    }),
  } as any;
}

describe('ChartShareGuard', () => {
  let guard: ChartShareGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ChartShareGuard(
      mockReflector as unknown as Reflector,
      mockChartRepo as any,
      mockChartShareRepo as any,
    );
  });

  it('returns true when no privilege decorator is present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const result = await guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when privilege required but no userId', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('read');
    await expect(guard.canActivate(makeCtx({ id: 'chart-1' }, undefined))).rejects.toThrow(ForbiddenException);
  });

  it('returns true when privilege required but no chartId in params', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('read');
    const result = await guard.canActivate(makeCtx({}, 'user-1'));
    expect(result).toBe(true);
  });

  it('throws NotFoundException when chart does not exist', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('read');
    mockChartRepo.findOne.mockResolvedValue(null);
    await expect(guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'))).rejects.toThrow(NotFoundException);
  });

  it('returns true when userId matches chart owner', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('canEdit');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'user-1' });
    const result = await guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'));
    expect(result).toBe(true);
  });

  it('returns true for read privilege when a share record exists', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('read');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue({ chartId: 'chart-1', sharedWithUserId: 'user-1' });
    const result = await guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException for read privilege when no share record exists', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('read');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue(null);
    await expect(guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('returns true for canEdit privilege when share.canEdit is true', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('canEdit');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue({ canEdit: true, canDelete: false, canShare: false });
    const result = await guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException for canEdit privilege when share.canEdit is false', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('canEdit');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue({ canEdit: false, canDelete: true, canShare: true });
    await expect(guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for canDelete privilege when share exists but canDelete is false', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('canDelete');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue({ canEdit: true, canDelete: false, canShare: true });
    await expect(guard.canActivate(makeCtx({ id: 'chart-1' }, 'user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('supports :chartId param in addition to :id', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('canShare');
    mockChartRepo.findOne.mockResolvedValue({ id: 'chart-1', createdByUserId: 'owner' });
    mockChartShareRepo.findOne.mockResolvedValue({ canEdit: false, canDelete: false, canShare: true });
    const result = await guard.canActivate(makeCtx({ chartId: 'chart-1' }, 'user-1'));
    expect(result).toBe(true);
    expect(mockChartRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'chart-1' } }));
  });
});
