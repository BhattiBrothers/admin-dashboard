import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useInviteMember } from './hooks'
import { inviteMemberSchema, type InviteMemberValues } from './invite-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const invite = useInviteMember(organizationId)

  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: InviteMemberValues) {
    invite.mutate(values.email, {
      onSuccess: () => {
        toast.success(`Invitation sent to ${values.email}`)
        form.reset({ email: '' })
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-start gap-2"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="email"
                  placeholder="member@example.com"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <UserPlus className="mr-1.5 size-4" />
          )}
          Invite
        </Button>
      </form>
    </Form>
  )
}
