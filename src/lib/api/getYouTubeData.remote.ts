import { command } from '$app/server'
import { YOUTUBE_API_KEY } from '$env/static/private'
import { error } from '@sveltejs/kit'
import wretch from 'wretch'
import * as z from 'zod'

export const getYouTubeData = command(z.string(), async (videoID) => {
  try {
    return await wretch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&key=${YOUTUBE_API_KEY}&part=snippet`,
    )
      .get()
      .json<YouTubeData>()
  } catch (error_) {
    return error(500, error_ instanceof Error ? error_.message : String(error_))
  }
})

export type YouTubeData = {
  kind: string
  etag: string
  items: YouTubeItem[]
  pageInfo: YouTubePageInfo
}

export type YouTubeItem = {
  kind: string
  etag: string
  id: string
  snippet: YouTubeSnippet
}

export type YouTubeLocalized = {
  title: string
  description: string
}

export type YouTubePageInfo = {
  totalResults: number
  resultsPerPage: number
}

export type YouTubeSnippet = {
  publishedAt: Date
  channelId: string
  title: string
  description: string
  thumbnails: YouTubeThumbnails
  channelTitle: string
  tags: string[]
  categoryId: string
  liveBroadcastContent: string
  defaultLanguage: string
  localized: YouTubeLocalized
  defaultAudioLanguage: string
}

export type YouTubeThumbnailData = {
  url: string
  width: number
  height: number
}

export type YouTubeThumbnails = {
  default: YouTubeThumbnailData
  medium: YouTubeThumbnailData
  high: YouTubeThumbnailData
  standard: YouTubeThumbnailData
  maxres: YouTubeThumbnailData
}
