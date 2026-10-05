import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../services/platform.js';
import { queryKeys } from '../queryKeys.js';

export function usePlatformHealth(options = {}) {
  return useQuery({
    queryKey: queryKeys.platform.health(),
    queryFn: () => platformApi.getHealth(),
    ...options,
  });
}

export function useCurrentUser(options = {}) {
  return useQuery({
    queryKey: queryKeys.platform.user(),
    queryFn: () => platformApi.getCurrentUser(),
    retry: false,
    ...options,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials) => platformApi.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.user() });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => platformApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.user() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => platformApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useSettings(options = {}) {
  return useQuery({
    queryKey: queryKeys.platform.settings(),
    queryFn: () => platformApi.getSettings(),
    ...options,
  });
}
