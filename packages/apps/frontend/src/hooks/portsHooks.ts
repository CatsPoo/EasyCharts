import type { Port, PortCreate } from "@easy-charts/easycharts-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export async function getPortById(portId: string): Promise<Port> {
  const response = await fetch(`/api/ports/${portId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for port ID: ${portId}`);
  }
  return await response.json() as Port;
}

export async function createPort(dto: PortCreate): Promise<Port> {
  const res = await fetch(`api/ports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Failed to create port (${res.status})`);
  }
  return res.json();
}