import type { Permission } from "@easy-charts/easycharts-types";

export interface SubmitPayload  {
  username: string;
  isActive: boolean;
  permissions: Permission[];
  password?: string; // only when creating or explicitly resetting
};