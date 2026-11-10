import * as z from 'zod'

export const gameVersionPattern = '\\d\\.\\d{1,2}(\\.\\d{1,2})?'
export const VersionNumberSchema = z.string().regex(new RegExp(`^${gameVersionPattern}$`, 'u'))

export const GameVersionSchema = z.object({
  version: VersionNumberSchema,
  name: z.string(),
  wip: z.optional(z.boolean()),
  url: z.optional(z.union([z.httpUrl(), z.literal('')])),
  note: z.optional(z.string()),
  compatible: z.optional(z.array(VersionNumberSchema)),
})

export const GameVersionsSchema = z.object({
  currentVersion: VersionNumberSchema,
  versions: z.array(GameVersionSchema),
})

export type GameVersion = z.infer<typeof GameVersionSchema>
export type GameVersions = z.infer<typeof GameVersionsSchema>
