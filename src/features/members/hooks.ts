import { useQuery } from '@tanstack/react-query'
import { fetchMembers } from './api'

export const memberKeys = {
  byOrg: (organizationId: string) =>
    ['members', organizationId] as const,
}

export function useMembers(organizationId: string) {
  return useQuery({
    queryKey: memberKeys.byOrg(organizationId),
    queryFn: () => fetchMembers(organizationId),
    enabled: Boolean(organizationId),
  })
}
