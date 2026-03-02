import * as z from 'zod'

export const GameVersionSchema = z.object({
  version: z.string(),
  name: z.string(),
  wip: z.optional(z.boolean()),
  url: z.optional(z.union([z.httpUrl(), z.literal('')])),
  note: z.optional(z.string()),
  compatible: z.optional(z.array(z.string())),
})

export const GameVersionsSchema = z.object({ currentVersion: z.string(), versions: z.array(GameVersionSchema) })

export type GameVersion = z.infer<typeof GameVersionSchema>
export type GameVersions = z.infer<typeof GameVersionsSchema>
