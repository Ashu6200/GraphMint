import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../services/core.js';
import { queryKeys } from '../queryKeys.js';

export function useCoreHealth(options = {}) {
  return useQuery({
    queryKey: queryKeys.core.health(),
    queryFn: () => coreApi.getHealth(),
    ...options,
  });
}

export function useGraphs(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.core.graphs(),
    queryFn: () => coreApi.getGraphs(params),
    ...options,
  });
}

export function useGraphDetail(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.core.graph(id),
    queryFn: () => coreApi.getGraphById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateGraph() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => coreApi.createGraph(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.core.graphs() });
    },
  });
}

export function useNodes(graphId, options = {}) {
  return useQuery({
    queryKey: queryKeys.core.nodes(graphId),
    queryFn: () => coreApi.getNodes(graphId),
    enabled: Boolean(graphId),
    ...options,
  });
}

export function useEdges(graphId, options = {}) {
  return useQuery({
    queryKey: queryKeys.core.edges(graphId),
    queryFn: () => coreApi.getEdges(graphId),
    enabled: Boolean(graphId),
    ...options,
  });
}
