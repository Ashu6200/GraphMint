import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi } from '../services/ai.js';
import { queryKeys } from '../queryKeys.js';

export function useAiHealth(options = {}) {
  return useQuery({
    queryKey: queryKeys.ai.health(),
    queryFn: () => aiApi.getHealth(),
    ...options,
  });
}

export function useAiGenerateGraph() {
  return useMutation({
    mutationFn: (promptData) => aiApi.generateGraph(promptData),
  });
}

export function useAiSuggestNodes() {
  return useMutation({
    mutationFn: (context) => aiApi.suggestNodes(context),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (messages) => aiApi.chat(messages),
  });
}
