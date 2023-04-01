// eslint-disable-next-line canonical/filename-match-exported
import type {RequestHandler} from '@sveltejs/kit'
import {error as kitError} from '@sveltejs/kit'
import {launch} from 'puppeteer'

export const GET = (async ({url}) => {
  const targetUrl = url.searchParams.get('targetUrl')

  if (!targetUrl) {
    throw kitError(400, 'No data received')
  }

  const browser = await launch()
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
      request.abort()
    } else {
      request.continue()
    }
  })
  await page.setJavaScriptEnabled(false)
  await page.goto(targetUrl)
  const pageContent = await page.content()
  await browser.close()

  return new Response(pageContent)
}) satisfies RequestHandler
