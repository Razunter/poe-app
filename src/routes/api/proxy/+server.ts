import { error, error as kitError, json, type RequestHandler } from '@sveltejs/kit'
import { type Browser, launch } from 'puppeteer'

let browser: Browser

const getVersionFromTitle = (title: string) => {
  const version = /3\.\d{1,2}/u.exec(title)

  return version?.[0] ?? ''
}

export const GET: RequestHandler = (async ({ url }) => {
  const mode = url.searchParams.get('mode')
  const targetUrl = url.searchParams.get('targetUrl')

  if (!targetUrl && !mode) {
    throw kitError(400, 'No data received')
  }

  if (mode === 'start') {
    browser = await launch()
    return new Response('success')
  } else if (mode === 'end') {
    browser?.close()
    return new Response('success')
  }

  if (targetUrl && browser) {
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (
        request.resourceType() === 'image' ||
        request.resourceType() === 'stylesheet' ||
        request.resourceType() === 'font'
      ) {
        request.abort()
      } else {
        request.continue()
      }
    })
    await page.setJavaScriptEnabled(false)
    const response = await page.goto(targetUrl)

    if (response && response.ok()) {
      const versionOutput = getVersionFromTitle(await page.title())

      return json(versionOutput)
    } else if (response) {
      return error(response.status(), response.statusText())
    } else {
      return error(500, 'Internal Server Error')
    }
  }

  return new Response('Error: browser undefined')
}) satisfies RequestHandler
