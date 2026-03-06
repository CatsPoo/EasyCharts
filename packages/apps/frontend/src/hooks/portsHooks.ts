import type { Port, PortCreate, PortUpdate } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export async function getPortById(portId: string): Promise<Port> {
  try {
    const { data } = await http.get<Port>(`/ports/${portId}`);
    return data;
  } catch {
    throw new Error(`Failed to fetch data for port ID: ${portId}`);
  }
}

export async function createPort(dto: PortCreate): Promise<Port> {
  try {
    const {data} = await http.post<Port>(`/ports`,dto);
    return data
  } catch (err: any) {
    throw new Error(err || `Failed to create portk`);
  }
}

export async function updatePort(id: string, dto: PortUpdate): Promise<Port> {
  try {
    const { data } = await http.put<Port>(`/ports/${id}`, dto);
    return data;
  } catch (err: any) {
    throw new Error(err || `Failed to update port`);
  }
}

export async function deletePort(id: string): Promise<void> {
  try {
    await http.delete(`/ports/${id}`);
  } catch (err: any) {
    throw new Error(err || `Failed to delete port`);
  }
}
