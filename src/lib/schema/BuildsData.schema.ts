import { BuildCategorySchema } from '$lib/schema/BuildsCategory.schema.ts'
import { GameVersionSchema } from '$lib/schema/GameVersion.schema.ts'
import * as z from 'zod'

export const BuildListSchema = z.array(BuildCategorySchema)

export const BuildTypesSchema = z.record(z.string(), z.string())

export const BuildsDataFileSchema = z.object({
  buildList: BuildListSchema,
  types: BuildTypesSchema,
})

export const BuildsDataSchema = z.object({
  buildList: BuildListSchema,
  types: BuildTypesSchema,
  versions: z.array(GameVersionSchema),
  currentVersion: z.string(),
})

export type BuildList = z.infer<typeof BuildListSchema>
export type BuildTypes = z.infer<typeof BuildTypesSchema>
export type BuildsDataFile = z.infer<typeof BuildsDataFileSchema>
export type BuildsData = z.infer<typeof BuildsDataSchema>
