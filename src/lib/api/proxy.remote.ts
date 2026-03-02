import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import { type Browser, launch } from 'puppeteer'
import * as z from 'zod'

let browser: Browser

const versionRegex = /3\.\d{1,2}/u

const getVersionFromTitle = (title: string) => {
  const version = versionRegex.exec(title)

  return version?.[0] ?? ''
}

export const proxy = command(
  z.object({ mode: z.string().optional(), targetUrl: z.httpUrl().optional() }),
  async ({ mode, targetUrl }) => {
    if (mode === 'start') {
      browser = await launch()
      return 'success'
    } else if (mode === 'end') {
      browser?.close()
      return 'success'
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
        return getVersionFromTitle(await page.title())
      } else if (response) {
        return error(response.status(), response.statusText())
      } else {
        return error(500, 'Internal Server Error')
      }
    }

    return error(500, 'Error: browser undefined')
  },
)
