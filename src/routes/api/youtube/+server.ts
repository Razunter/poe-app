// eslint-disable-next-line canonical/filename-match-exported
import type {RequestHandler} from '@sveltejs/kit'
import {error, json} from '@sveltejs/kit'
import {YOUTUBE_API_KEY} from '$env/static/private'
import axios from 'axios'

export const GET: RequestHandler = (async ({url}) => {
  const videoID = url.searchParams.get('videoID')

  if (!videoID) {
    throw error(400, 'Error: No VideoID')
  }

  try {
    const {data} = await axios.get<YouTubeData>(`https://www.googleapis.com/youtube/v3/videos?id=${videoID}&key=${YOUTUBE_API_KEY}&part=snippet`)

    if (data) {
      return json(data)
    } else {
      throw error(500, 'Can\'t get YouTube data')
    }
  } catch (error_) {
    throw error(500, error_ instanceof Error ? error_.message : String(error_))
  }
}) satisfies RequestHandler

export type YouTubeData = {
  kind: string;
  etag: string;
  items: YouTubeItem[];
  pageInfo: YouTubePageInfo;
}

export type YouTubeItem = {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeSnippet;
}

export type YouTubeSnippet = {
  publishedAt: Date;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags: string[];
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage: string;
  localized: YouTubeLocalized;
  defaultAudioLanguage: string;
}

export type YouTubeLocalized = {
  title: string;
  description: string;
}

export type YouTubeThumbnails = {
  default: YouTubeThumbnailData;
  medium: YouTubeThumbnailData;
  high: YouTubeThumbnailData;
  standard: YouTubeThumbnailData;
  maxres: YouTubeThumbnailData;
}

export type YouTubeThumbnailData = {
  url: string;
  width: number;
  height: number;
}

export type YouTubePageInfo = {
  totalResults: number;
  resultsPerPage: number;
}

