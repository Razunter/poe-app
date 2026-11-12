import type { Build } from '../src/lib/schema/Build.schema.ts'
import { collectionPath, expect, test } from './collectionTest.ts'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const build = (title: string, versions: string[], url = `https://example.com/${title}`): Build => ({
  title,
  versions,
  url,
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
      build('current-protected', ['3.26.1'], 'https://www.youtube.com/watch?v=current0001'),
      build('compatible-protected', ['3.23'], 'https://www.youtube.com/watch?v=compat00001'),
      build('current-share-protected', ['3.26.1'], 'https://youtu.be/current0001'),
      build('compatible-share-protected', ['3.23'], 'https://youtu.be/compat00001'),
      build('outdated-youtube', ['3.26'], 'https://www.youtube.com/watch?v=outdated001'),
      build('outdated-share', ['3.26'], 'https://youtu.be/outdated001'),
      build('recent-incidental-path', ['3.26'], 'https://example.com/youtube.com/recent'),
      build('recent-incidental-query', ['3.25'], 'https://example.com/recent?source=youtube.com'),
      build('old-incidental-path', ['3.24'], 'https://example.com/youtube.com/old'),
      build('old-incidental-query', ['3.24'], 'https://example.com/old?source=youtube.com'),
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
    'https://www.youtube.com/watch?v=current0001',
    'https://www.youtube.com/watch?v=compat00001',
    'https://youtu.be/current0001',
    'https://youtu.be/compat00001',
    'https://example.com/youtube.com/recent',
    'https://example.com/recent?source=youtube.com',
  ])
})

test('release distance retains non-YouTube builds when the current release is unknown', async ({ page }) => {
  await loadCollection(
    '3.26.1',
    ['3.20', '3.21', '3.22', '3.23'],
    [
      build('unknown-current', ['3.20']),
      build('outdated-youtube', ['3.20'], 'https://www.youtube.com/watch?v=outdated001'),
    ],
  )
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await page.getByRole('button', { name: 'Cleanup outdated', exact: true }).click()
  await expect(page.locator('#melee a[title]')).toHaveText(['https://example.com/unknown-current'])
})
