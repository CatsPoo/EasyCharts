import { http } from "../api/http";


export const locChart = async (id: string): Promise<ChartLock> => {
  const { data } = await http.patch<ChartLock>(`/charts/${id}/lock`);
  return data;
};
export const releaseLock = async (id: string): Promise<void> => {
  await http.patch(`/charts/${id}/unlock`);
};
