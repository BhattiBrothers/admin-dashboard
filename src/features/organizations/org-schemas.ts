import { z } from 'zod'

export const createOrganizationSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    type: z.enum(['school', 'nonprofit', 'business']),
    school_district: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    // Conditional field: a School must have a district; others must not.
    if (values.type === 'school' && !values.school_district) {
      ctx.addIssue({
        code: 'custom',
        path: ['school_district'],
        message: 'School district is required for schools',
      })
    }
  })

export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>
