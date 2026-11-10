import type { Build } from '../src/lib/schema/Build.schema.ts'
import { collectionPath, expect, test } from './collectionTest.ts'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const build = (title: string, versions: string[], youtube = false): Build => ({
  title,
  versions,
  url: youtube ? `https://www.youtube.com/watch?v=${title}` : `https://example.com/${title}`,
})

const loadCollection = async (
  currentVersion: string,
  releases: string[],
  builds: Build[],
  compatible: string[] = [],
) => {
  await writeFile(
    path.join(collectionPath, 'versions.json'),
    JSON.stringify({
      currentVersion,
      versions: releases.map((version) => ({
        version,
        name: version,
        ...(version === currentVersion ? { compatible } : {}),
      })),
    }),
  )
  await writeFile(
    path.join(collectionPath, `data-${currentVersion.replaceAll('.', '-')}.json`),
    JSON.stringify({ types: { melee: 'Melee' }, buildList: [{ type: 'melee', builds }] }),
  )
}

test('newest version determines visible sorting and cleanup regardless of tag order', async ({ page }) => {
  await loadCollection(
    '3.26',
    ['3.26', '3.20', '3.25', '3.21', '3.24'],
    [build('older', ['3.24']), build('reversed', ['3.25', '3.20']), build('ascending', ['3.20', '3.25'])],
  )
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await page.getByRole('button', { name: 'Sort builds', exact: true }).click()
  await expect(page.locator('#melee a[title]')).toHaveText([
    'https://example.com/reversed',
    'https://example.com/ascending',
    'https://example.com/older',
  ])
  await page.getByRole('button', { name: 'Cleanup outdated', exact: true }).click()
  await expect(page.locator('#melee a[title]')).toHaveText([
    'https://example.com/reversed',
    'https://example.com/ascending',
    'https://example.com/older',
  ])
  await expect(page.locator('#melee h4').first()).toContainText('3.20')
})

test('release distance retains adjacent patches and two releases but removes more than two', async ({ page }) => {
  await loadCollection(
    '3.26.1',
    ['3.26.1', '3.23', '3.26', '3.24', '3.25'],
    [
      build('adjacent-base', ['3.26']),
      build('two-releases', ['3.25']),
      build('three-releases', ['3.24']),
      build('unknown-age', ['3.19']),
      build('current-protected', ['3.26.1'], true),
      build('compatible-protected', ['3.23'], true),
      build('outdated-youtube', ['3.26'], true),
    ],
    ['3.23'],
  )
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await page.getByRole('button', { name: 'Cleanup outdated', exact: true }).click()
  await expect(page.locator('#melee a[title]')).toHaveText([
    'https://example.com/adjacent-base',
    'https://example.com/two-releases',
    'https://example.com/unknown-age',
    'https://www.youtube.com/watch?v=current-protected',
    'https://www.youtube.com/watch?v=compatible-protected',
  ])
})

test('release distance retains non-YouTube builds when the current release is unknown', async ({ page }) => {
  await loadCollection(
    '3.26.1',
    ['3.20', '3.21', '3.22', '3.23'],
    [build('unknown-current', ['3.20']), build('outdated-youtube', ['3.20'], true)],
  )
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await page.getByRole('button', { name: 'Cleanup outdated', exact: true }).click()
  await expect(page.locator('#melee a[title]')).toHaveText(['https://example.com/unknown-current'])
})
