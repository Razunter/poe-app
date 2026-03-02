import { BuildSchema } from '$lib/schema/Build.schema.ts'
import * as z from 'zod'

export const BuildCategorySchema = z.object({
  type: z.string(),
  builds: z.array(BuildSchema),
})

export type BuildCategory = z.infer<typeof BuildCategorySchema>
