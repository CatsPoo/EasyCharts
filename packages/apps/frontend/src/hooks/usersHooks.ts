import type { User, UserUpdate } from "@easy-charts/easycharts-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../api/http";


export async function getUserProfile(): Promise<User> {
  try{
    const {data} = await http.get<User>(`/users/profile`);
    return data
  }
  catch(err:any){
    throw new Error(`Failed to fetch user profile`);
  }
}


export async function updateUser(id: string, dto: UserUpdate): Promise<User> {
  try{
    const {data} = await http.patch<User>(`/users/${id}`,dto)
    return data
  }
  catch(err:any){
    throw new Error(err || `Failed to update user ${err}`);
  }
}


export function useUpdateUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => updateUser(id, data),
    onSuccess: (saved, vars) => {
      // EITHER directly update cache to avoid a refetch:
      qc.setQueryData(['user', saved.id], saved);

      // AND/OR invalidate so useChartById refetches:
      qc.invalidateQueries({ queryKey: ['user', saved.id] });
    },
  });
}