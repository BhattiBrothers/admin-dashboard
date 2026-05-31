import { z } from 'zod'

export const inviteMemberSchema = z.object({
  email: z.email('Enter a valid email address'),
})

export type InviteMemberValues = z.infer<typeof inviteMemberSchema>
