import { YOUTUBE_API_KEY } from '$app/env/private'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import wretch from 'wretch'
import * as z from 'zod'

const videoIdSchema = z.string().regex(/^[\w-]{11}$/u)
const thumbnailSchema = z.object({
  url: z.httpUrl(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})
const thumbnailsSchema = z.object({
  default: thumbnailSchema.optional(),
  medium: thumbnailSchema.optional(),
  high: thumbnailSchema.optional(),
  standard: thumbnailSchema.optional(),
  maxres: thumbnailSchema.optional(),
})
const snippetSchema = z.looseObject({
  title: z.string().trim().min(1),
  channelTitle: z.string().trim().min(1),
  thumbnails: thumbnailsSchema.default({}),
})
const itemSchema = z.looseObject({
  id: videoIdSchema,
  snippet: snippetSchema,
})
const dataSchema = z.looseObject({ items: z.array(itemSchema) })

export const getYouTubeData = command(videoIdSchema, async (videoID) => {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('id', videoID)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  url.searchParams.set('part', 'snippet')

  try {
    const data = dataSchema.parse(
      await wretch(url.toString())
        .options({ signal: AbortSignal.timeout(15_000) })
        .get()
        .json<unknown>(),
    )
    if (data.items.some((item) => item.id !== videoID)) {
      throw new Error('YouTube returned a different video')
    }

    return data
  } catch {
    return error(500, 'YouTube metadata lookup failed')
  }
})

export type YouTubeData = z.infer<typeof dataSchema>
export type YouTubeItem = z.infer<typeof itemSchema>
