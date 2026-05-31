import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import type { OrganizationType } from '@/types/db'
import { useOrganizations } from './hooks'
import { CreateOrganizationDialog } from './CreateOrganizationDialog'
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

const typeBadgeVariant: Record<
  OrganizationType,
  'default' | 'secondary' | 'outline'
> = {
  school: 'default',
  nonprofit: 'secondary',
  business: 'outline',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OrganizationsPage() {
  const navigate = useNavigate()
  const { data: organizations, isLoading, isError, error } = useOrganizations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Organizations you manage.
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load organizations: {(error as Error).message}
        </div>
      )}

      {!isLoading && !isError && organizations?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No organizations yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first organization to get started.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && organizations && organizations.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={typeBadgeVariant[org.type]} className="capitalize">
                      {org.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {org.member_count}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(org.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
