import * as z from 'zod'

export const BuildSchema = z.object({
  title: z.string(),
  url: z.httpUrl(),
  video: z.optional(z.httpUrl()),
  videothumb: z.optional(
    z.object({
      '480w': z.optional(z.httpUrl()),
      '640w': z.optional(z.httpUrl()),
      '1280w': z.optional(z.httpUrl()),
    }),
  ),
  versions: z.array(z.string()).min(1),
  author: z.optional(z.string()),
  pin: z.optional(z.boolean()),
  skip: z.optional(z.boolean()),
  tags: z.optional(z.array(z.string())),
})

export type Build = z.infer<typeof BuildSchema>
