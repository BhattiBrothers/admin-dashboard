import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
} from './api'

export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: string) => ['organizations', id] as const,
}

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: fetchOrganizations,
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => fetchOrganization(id),
    enabled: Boolean(id),
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      // Invalidate the directory so the new org appears without a reload.
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}
