import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';

export const chatKeys = {
  conversations: ['chat', 'conversations'],
  history: (otherUserId) => ['chat', 'history', otherUserId],
  userSearch: (q) => ['chat', 'user-search', q],
};

// 1-on-1 conversation list with last message + unread counts
export function useConversations(enabled = true) {
  return useQuery({ queryKey: chatKeys.conversations, queryFn: chatApi.fetchConversations, enabled });
}

// Message history with one specific user
export function useChatHistory(otherUserId) {
  return useQuery({
    queryKey: chatKeys.history(otherUserId),
    queryFn: () => chatApi.fetchHistory(otherUserId),
    enabled: Boolean(otherUserId),
  });
}

// People search (min 2 chars; component debounces before calling)
export function useUserSearch(q) {
  const query = (q ?? '').trim();
  return useQuery({
    queryKey: chatKeys.userSearch(query),
    queryFn: () => chatApi.searchUsers(query),
    enabled: query.length >= 2,
    retry: false,
  });
}
