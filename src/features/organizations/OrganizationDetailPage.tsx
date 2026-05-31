import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { MemberStatus } from '@/types/db'
import { useOrganization } from './hooks'
import { useMembers } from '@/features/members/hooks'
import { InviteMemberForm } from '@/features/members/InviteMemberForm'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusBadgeVariant: Record<MemberStatus, 'default' | 'secondary'> = {
  active: 'default',
  invited: 'secondary',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OrganizationDetailPage() {
  const { id = '' } = useParams()
  const org = useOrganization(id)
  const members = useMembers(id)

  if (org.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (org.isError || !org.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Organization not found or you don&apos;t have access.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {org.data.name}
          </h1>
          <Badge className="capitalize" variant="secondary">
            {org.data.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Created {formatDate(org.data.created_at)}
          {org.data.type === 'school' && org.data.school_district && (
            <> · School district: {org.data.school_district}</>
          )}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Members</h2>

        <InviteMemberForm organizationId={id} />

        {members.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {members.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load members: {(members.error as Error).message}
          </div>
        )}

        {!members.isLoading && !members.isError && members.data?.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No members yet.
          </div>
        )}

        {!members.isLoading &&
          !members.isError &&
          members.data &&
          members.data.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.data.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {member.role}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant[member.status]}
                          className="capitalize"
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(member.invited_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </section>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      All organizations
    </Link>
  )
}
