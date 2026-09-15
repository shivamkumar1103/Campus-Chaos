import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lostFoundApi } from '../api/lostFoundApi';

export const lostFoundKeys = {
  all: ['lost-found'],
  list: (params) => ['lost-found', 'list', params ?? {}],
  detail: (id) => ['lost-found', 'detail', id],
};

// GET /lost-found?q=&type=&category=&status= — public, global feed
export function useLostFoundItems(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return useQuery({ queryKey: lostFoundKeys.list(clean), queryFn: () => lostFoundApi.fetchItems(clean) });
}

export function useLostFoundItem(id) {
  return useQuery({
    queryKey: lostFoundKeys.detail(id),
    queryFn: () => lostFoundApi.fetchItem(id),
    enabled: Boolean(id),
  });
}

// POST /lost-found (multipart) — requires login (cookie)
export function useReportItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => lostFoundApi.reportItem(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lostFoundKeys.all }),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => lostFoundApi.deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lostFoundKeys.all }),
  });
}
