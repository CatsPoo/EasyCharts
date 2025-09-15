import type { Side } from "@easy-charts/easycharts-types";

export type onHandleContextMenuPayload = (
  e: any,
  info: {
    deviceId: string;
    portId: string;
    role: "source" | "target";
    side?: Side;
  }
) => void;
