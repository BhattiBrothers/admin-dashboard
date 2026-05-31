// Database row types — kept in sync with supabase/migrations.

export type OrganizationType = 'school' | 'nonprofit' | 'business'
export type MemberStatus = 'invited' | 'active'
export type MemberRole = 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  school_district: string | null
  created_by: string
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string | null
  email: string
  status: MemberStatus
  role: MemberRole
  invited_at: string
  joined_at: string | null
}

// Directory row: an organization plus its member count.
export interface OrganizationWithCount extends Organization {
  member_count: number
}

export const ORGANIZATION_TYPES: {
  value: OrganizationType
  label: string
}[] = [
  { value: 'school', label: 'School' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'business', label: 'Business' },
]
