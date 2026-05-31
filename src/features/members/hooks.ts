import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMembers, inviteMember } from './api'

export const memberKeys = {
  byOrg: (organizationId: string) => ['members', organizationId] as const,
}

export function useMembers(organizationId: string) {
  return useQuery({
    queryKey: memberKeys.byOrg(organizationId),
    queryFn: () => fetchMembers(organizationId),
    enabled: Boolean(organizationId),
  })
}

export function useInviteMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => inviteMember({ organizationId, email }),
    onSuccess: () => {
      // Refresh this org's members and the directory (member counts).
      queryClient.invalidateQueries({ queryKey: memberKeys.byOrg(organizationId) })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}
