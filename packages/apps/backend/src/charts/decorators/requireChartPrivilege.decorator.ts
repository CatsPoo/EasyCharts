import { SetMetadata } from '@nestjs/common';

/**
 * Resource-level privilege required on the chart identified by :id / :chartId.
 *
 * - 'read'      → user must be the chart owner OR have any share record
 * - 'canEdit'   → user must be owner OR share.canEdit === true
 * - 'canDelete' → user must be owner OR share.canDelete === true
 * - 'canShare'  → user must be owner OR share.canShare === true
 */
export type ChartSharePrivilege = 'read' | 'canEdit' | 'canDelete' | 'canShare';

export const CHART_PRIVILEGE_KEY = 'requiredChartPrivilege';

export const RequireChartPrivilege = (privilege: ChartSharePrivilege) =>
  SetMetadata(CHART_PRIVILEGE_KEY, privilege);
