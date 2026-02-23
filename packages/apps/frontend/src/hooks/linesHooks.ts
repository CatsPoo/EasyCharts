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
