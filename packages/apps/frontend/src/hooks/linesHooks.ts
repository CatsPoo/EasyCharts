import type { Port } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export async function fetchConnectedPortIds(
  portIds: string[],
): Promise<Record<string, string>> {
  if (!portIds.length) return {};
  const { data } = await http.post<Record<string, string>>(
    "/lines/connected-port-ids",
    { portIds },
  );
  return data;
}

export interface BondPortSiblingsResponse {
  bondId: string;
  bondName: string;
  sameSide: Port[];
  otherSide: { deviceId: string; ports: Port[] }[];
  memberLinePairs: { lineId: string; sourcePortId: string; targetPortId: string }[];
}

export async function fetchConnectedPortInfo(portId: string): Promise<Port | null> {
  const { data } = await http.post<Port | null>('/lines/connected-port-info', { portId });
  return data;
}

export async function fetchBondPortSiblings(
  portId: string,
  deviceId: string,
): Promise<BondPortSiblingsResponse | null> {
  const { data } = await http.post<BondPortSiblingsResponse | null>(
    "/lines/bond-port-siblings",
    { portId, deviceId },
  );
  return data;
}
