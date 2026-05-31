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
