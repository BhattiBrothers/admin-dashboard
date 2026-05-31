import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { OrganizationMember } from '@/types/db'

/** Members of an organization (RLS restricts this to orgs the caller owns). */
export async function fetchMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .order('invited_at', { ascending: false })

  if (error) throw error
  return (data as OrganizationMember[] | null) ?? []
}

/**
 * Invite a member. This goes through the `invite-member` Edge Function, which
 * verifies ownership server-side and prevents duplicates — never trusted to
 * the client.
 */
export async function inviteMember(input: {
  organizationId: string
  email: string
}): Promise<void> {
  const { error } = await supabase.functions.invoke('invite-function', {
    body: { organization_id: input.organizationId, email: input.email },
  })

  if (error) {
    // Surface the function's friendly error message (e.g. duplicate / no access).
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.error ?? 'Failed to send invitation')
    }
    throw new Error(error.message)
  }
}
