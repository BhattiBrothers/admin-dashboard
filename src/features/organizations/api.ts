import { supabase } from '@/lib/supabase'
import type {
  Organization,
  OrganizationType,
  OrganizationWithCount,
} from '@/types/db'

type OrganizationRow = Organization & {
  organization_members: { count: number }[]
}

/** All organizations created by the signed-in admin, with member counts. */
export async function fetchOrganizations(): Promise<OrganizationWithCount[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*, organization_members(count)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as OrganizationRow[] | null ?? []).map(
    ({ organization_members, ...org }) => ({
      ...org,
      member_count: organization_members?.[0]?.count ?? 0,
    }),
  )
}

/** A single organization (RLS ensures the caller owns it). */
export async function fetchOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Organization
}

export interface CreateOrganizationInput {
  name: string
  type: OrganizationType
  school_district: string | null
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('You must be signed in to create an organization.')

  const { data, error } = await supabase
    .from('organizations')
    .insert({ ...input, created_by: userId })
    .select()
    .single()

  if (error) throw error
  return data as Organization
}
