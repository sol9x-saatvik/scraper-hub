import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMonitoredUsers,
  addMonitoredUser,
  updateMonitoredUser,
  deleteMonitoredUser,
  type MonitoredUser,
} from "@/services/api";

export const MONITORED_USERS_KEY = ["monitored-users"];

export function useMonitoredUsers() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: MONITORED_USERS_KEY,
    queryFn: getMonitoredUsers,
  });

  const addMutation = useMutation({
    mutationFn: (user: Partial<MonitoredUser>) => addMonitoredUser(user),
    onSuccess: () => qc.invalidateQueries({ queryKey: MONITORED_USERS_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MonitoredUser> }) =>
      updateMonitoredUser(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: MONITORED_USERS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMonitoredUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MONITORED_USERS_KEY }),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addUser: addMutation.mutateAsync,
    updateUser: (id: string, updates: Partial<MonitoredUser>) =>
      updateMutation.mutateAsync({ id, updates }),
    removeUser: deleteMutation.mutateAsync,
  };
}
