import { type BuildsData, BuildsDataSchema } from '#lib/schema/BuildsData.schema.ts'
import { loadCollection, saveCollection } from '#lib/server/collectionPersistence.ts'
import { collectionPath, test as collectionTest, expect, saveBrowserCollection } from './collectionTest.ts'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { promisify } from 'node:util'

const jsonErrorPattern = /JSON/u
const test = collectionTest.extend<{ directory: string }>({
  directory: async ({ browserName }, provide) => {
    const directory = await fs.promises.mkdtemp(path.join(tmpdir(), `poe-persistence-${browserName}-`))
    try {
      await provide(directory)
    } finally {
      await fs.promises.rm(directory, { recursive: true, force: true })
    }
  },
})

const collection = (title: string, currentVersion = '3.27'): BuildsData => ({
  currentVersion,
  versions: [
    { version: '3.26', name: 'Previous league' },
    { version: currentVersion, name: title },
  ],
  types: { melee: 'Melee' },
  buildList: [{ type: 'melee', builds: [{ title, url: 'https://example.com/starter', versions: ['3.26'] }] }],
})

const writeCollection = async (directory: string, data: BuildsData, version = data.currentVersion) => {
  await fs.promises.writeFile(
    path.join(directory, 'versions.json'),
    JSON.stringify({ currentVersion: data.currentVersion, versions: data.versions }),
  )
  await fs.promises.writeFile(
    path.join(directory, 'data-' + version.replaceAll('.', '-') + '.json'),
    JSON.stringify({ buildList: data.buildList, types: data.types }),
  )
}

const pairBytes = async (directory: string, version = '3.27') => {
  return Promise.all(
    ['data-' + version.replaceAll('.', '-') + '.json', 'versions.json'].map(async (file) => {
      try {
        return await fs.promises.readFile(path.join(directory, file))
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return null
        }

        throw error
      }
    }),
  )
}

const withFilesystem = async (
  run: (original: Pick<typeof fs.promises, 'rename' | 'unlink' | 'writeFile'>) => Promise<void>,
) => {
  const original = {
    rename: fs.promises.rename,
    writeFile: fs.promises.writeFile,
    unlink: fs.promises.unlink,
  }
  try {
    await run(original)
  } finally {
    Object.assign(fs.promises, original)
  }
}

const interruptSave = async (directory: string, boundary: string, data: BuildsData) => {
  const result = await promisify(execFile)('bun', [
    path.resolve('tests/persistenceProcess.ts'),
    directory,
    boundary,
    JSON.stringify(data),
  ]).then(
    () => ({ code: 0, stderr: '' }),
    (error: Error & { code: number; stderr: string }) => error,
  )
  expect(result.stderr).toBe('')
  expect(result.code).toBe(23)
}

test('recoverable save commits the public two-file layout including multipart filenames', async ({ directory }) => {
  const data = collection('Saved collection', '3.27.1')
  await saveCollection(directory, data)
  expect(await loadCollection(directory)).toEqual(data)
  expect((await fs.promises.readdir(directory)).toSorted()).toEqual(['data-3-27-1.json', 'versions.json'])
  expect(JSON.parse(String(await fs.promises.readFile(path.join(directory, 'data-3-27-1.json'))))).toEqual({
    buildList: data.buildList,
    types: data.types,
  })
  expect(JSON.parse(String(await fs.promises.readFile(path.join(directory, 'versions.json'))))).toEqual({
    currentVersion: data.currentVersion,
    versions: data.versions,
  })
})

for (const stage of ['.collection-data.stage', '.collection-versions.stage', '.collection-save.json.pending']) {
  test(`recoverable save preserves prior bytes when staging ${stage} fails`, async ({ directory }) => {
    const previous = collection('Previous collection')
    await writeCollection(directory, previous)
    const before = await pairBytes(directory)
    await withFilesystem(async (original) => {
      fs.promises.writeFile = async (file, ...arguments_) => {
        if (path.basename(file.toString()) === stage) {
          throw new Error('Injected staging failure')
        }

        return original.writeFile(file, ...arguments_)
      }

      await expect(saveCollection(directory, collection('Rejected collection'))).rejects.toThrow('staging failure')
    })
    expect(await pairBytes(directory)).toEqual(before)
    expect(await loadCollection(directory)).toEqual(previous)
  })
}

for (const boundary of ['journal publication', 'data commit', 'versions commit', 'journal removal']) {
  test(`recoverable save restores prior bytes after failed ${boundary}`, async ({ directory }) => {
    const previous = collection('Previous collection')
    await writeCollection(directory, previous)
    const before = await pairBytes(directory)
    await withFilesystem(async (original) => {
      let failed = false
      fs.promises.rename = async (source, destination) => {
        const sourceName = path.basename(source.toString())
        const shouldFail =
          (boundary === 'journal publication' && sourceName === '.collection-save.json.pending') ||
          (boundary === 'data commit' && sourceName === '.collection-data.stage') ||
          (boundary === 'versions commit' && sourceName === '.collection-versions.stage')
        if (!failed && shouldFail) {
          failed = true
          throw new Error('Injected commit failure')
        }

        return original.rename(source, destination)
      }

      fs.promises.unlink = async (file) => {
        if (!failed && boundary === 'journal removal' && file.toString().endsWith('.collection-save.json')) {
          failed = true
          throw new Error('Injected commit failure')
        }

        return original.unlink(file)
      }

      await expect(saveCollection(directory, collection('Rejected collection'))).rejects.toThrow('commit failure')
    })
    expect(await pairBytes(directory)).toEqual(before)
    expect(await loadCollection(directory)).toEqual(previous)
  })
}

for (const existing of ['neither', 'metadata only', 'data only']) {
  for (const boundary of ['data', 'versions']) {
    test(`recoverable save restores missing first-save targets with ${existing} after ${boundary} failure`, async ({
      directory,
    }) => {
      const previous = collection('Previous collection')
      if (existing !== 'neither') {
        await writeCollection(directory, previous)
        await fs.promises.unlink(
          path.join(directory, existing === 'metadata only' ? 'data-3-27.json' : 'versions.json'),
        )
      }

      const before = await pairBytes(directory)
      await withFilesystem(async (original) => {
        fs.promises.rename = async (source, destination) => {
          if (path.basename(source.toString()) === `.collection-${boundary}.stage`) {
            throw new Error('Injected first-save failure')
          }

          return original.rename(source, destination)
        }

        await expect(saveCollection(directory, collection('Rejected collection'))).rejects.toThrow('first-save failure')
      })
      expect(await pairBytes(directory)).toEqual(before)
    })
  }
}

for (const boundary of ['data', 'versions']) {
  test(`recoverable save restores the previous pair after process interruption at ${boundary}`, async ({
    directory,
  }) => {
    const previous = collection('Previous collection')
    await writeCollection(directory, previous)
    const before = await pairBytes(directory)
    await interruptSave(directory, boundary, collection('Interrupted collection'))
    expect(await loadCollection(directory)).toEqual(previous)
    expect(await pairBytes(directory)).toEqual(before)
    expect(await loadCollection(directory)).toEqual(previous)
  })

  test(`recoverable save removes first-save targets after process interruption at ${boundary}`, async ({
    directory,
  }) => {
    await interruptSave(directory, boundary, collection('Interrupted first collection'))
    await expect(loadCollection(directory)).rejects.toThrow('ENOENT')
    expect(await pairBytes(directory)).toEqual([null, null])
    await saveCollection(directory, collection('Next collection'))
    expect(await loadCollection(directory)).toEqual(collection('Next collection'))
  })
}

test('recoverable save ignores interrupted unpublished staging', async ({ directory }) => {
  const previous = collection('Previous collection')
  await writeCollection(directory, previous)
  const before = await pairBytes(directory)
  await interruptSave(directory, 'staging', collection('Interrupted collection'))
  expect(await loadCollection(directory)).toEqual(previous)
  expect(await pairBytes(directory)).toEqual(before)
  await saveCollection(directory, collection('Next collection'))
  expect(await loadCollection(directory)).toEqual(collection('Next collection'))
})

test('recoverable save keeps previous bytes and reports the journal when rollback cannot finish', async ({
  directory,
}) => {
  const previous = collection('Previous collection')
  await writeCollection(directory, previous)
  const before = await pairBytes(directory)
  await withFilesystem(async (original) => {
    let commitFailed = false
    fs.promises.unlink = async (file) => {
      if (!commitFailed && file.toString().endsWith('.collection-save.json')) {
        commitFailed = true
        throw new Error('Injected commit-point failure')
      }

      return original.unlink(file)
    }

    fs.promises.rename = async (source, destination) => {
      if (path.basename(source.toString()) === 'versions.json.restore') {
        throw new Error('Injected persistent filesystem failure')
      }

      return original.rename(source, destination)
    }

    await expect(saveCollection(directory, collection('Rejected collection'))).rejects.toThrow(
      path.join(directory, '.collection-save.json'),
    )
    await expect(loadCollection(directory)).rejects.toThrow('recovery material remains')
  })
  expect(await loadCollection(directory)).toEqual(previous)
  expect(await pairBytes(directory)).toEqual(before)
})

test('recoverable save refuses a malformed journal without touching files outside the collection', async ({
  directory,
}) => {
  const nested = path.join(directory, 'collection')
  await fs.promises.mkdir(nested)
  const outside = path.join(directory, 'outside.json')
  await fs.promises.writeFile(outside, 'Keep these bytes')
  await fs.promises.writeFile(
    path.join(nested, '.collection-save.json'),
    JSON.stringify({ dataFile: '../outside.json', dataBefore: null, versionsBefore: null }),
  )
  await expect(loadCollection(nested)).rejects.toThrow('recovery material remains')
  expect(await fs.promises.readFile(outside, 'utf8')).toBe('Keep these bytes')
})

test('recoverable save serializes overlapping saves and reads across a half-commit', async ({ directory }) => {
  const previous = collection('Previous collection')
  const first = collection('First collection', '3.28')
  const second = collection('Second collection', '3.29')
  await writeCollection(directory, previous)
  await withFilesystem(async (original) => {
    const { promise: paused, resolve: reached } = Promise.withResolvers<undefined>()
    const { promise: gate, resolve: release } = Promise.withResolvers<undefined>()
    fs.promises.rename = async (source, destination) => {
      await original.rename(source, destination)
      if (path.basename(destination.toString()) === 'data-3-28.json') {
        reached(undefined)
        await gate
      }
    }

    const savingFirst = saveCollection(directory, first)
    await paused
    let readFinished = false
    let secondFinished = false
    const reading = loadCollection(directory).then((data) => {
      readFinished = true
      return data
    })
    const savingSecond = saveCollection(directory, second).then(() => {
      secondFinished = true
    })
    try {
      await setImmediate()
      expect(readFinished).toBe(false)
      expect(secondFinished).toBe(false)
    } finally {
      release(undefined)
      await savingFirst
      expect(await reading).toEqual(first)
      await savingSecond
    }
  })
  expect(await loadCollection(directory)).toEqual(second)
})

test('historical versions survive load without writing and remain valid for explicit save', async ({ directory }) => {
  const previous = collection('Older-only build')
  previous.buildList[0].builds[0].versions = ['3.10', '3.11.2']
  await writeCollection(directory, previous)
  const before = await pairBytes(directory)
  const loaded = await loadCollection(directory)
  expect(loaded).toEqual(previous)
  expect(await pairBytes(directory)).toEqual(before)
  await saveCollection(directory, BuildsDataSchema.parse(loaded))
  expect(await loadCollection(directory)).toEqual(previous)

  previous.buildList[0].builds[0].versions = []
  await writeCollection(directory, previous)
  await expect(loadCollection(directory)).rejects.toThrow()
})

for (const scenario of ['current missing', 'unordered multipart releases', 'no candidate', 'corrupt current']) {
  test(`fallback collection handles ${scenario} without rewriting current metadata`, async ({ directory }) => {
    const data = collection('Previous collection', scenario === 'unordered multipart releases' ? '3.30.2' : '3.27')
    if (scenario === 'unordered multipart releases') {
      data.versions = ['3.9', '3.29.1', '3.30.1', '3.30.2', '3.28.1'].map((version) => ({ version, name: version }))
      await writeCollection(directory, collection('Older available', '3.9'))
      await writeCollection(directory, data, '3.29.1')
    } else {
      await writeCollection(directory, data, '3.26')
    }

    const before = await fs.promises.readFile(path.join(directory, 'versions.json'))
    if (scenario === 'no candidate') {
      await fs.promises.unlink(path.join(directory, 'data-3-26.json'))
    }

    if (scenario === 'corrupt current') {
      await fs.promises.writeFile(path.join(directory, 'data-3-27.json'), '{')
    }

    if (scenario === 'no candidate' || scenario === 'corrupt current') {
      await expect(loadCollection(directory)).rejects.toThrow(
        scenario === 'no candidate' ? 'No collection file' : jsonErrorPattern,
      )
    } else {
      const loaded = await loadCollection(directory)
      expect(loaded).toEqual(data)
      expect(await pairBytes(directory, data.currentVersion)).toEqual([null, before])
      await saveCollection(directory, loaded)
      expect(await loadCollection(directory)).toEqual(data)
      expect(
        await fs.promises.readFile(
          path.join(directory, 'data-' + data.currentVersion.replaceAll('.', '-') + '.json'),
          'utf8',
        ),
      ).toContain('Previous collection')
    }

    expect(JSON.parse(String(await fs.promises.readFile(path.join(directory, 'versions.json'))))).toEqual(
      JSON.parse(before.toString()),
    )
  })
}

test('historical versions remain available through Show outdated and explicit browser Save', async ({ page }) => {
  const data = collection('Historical starter', '3.27')
  data.versions = [{ version: '3.27', name: 'Current league' }]
  await writeCollection(collectionPath, data)
  const before = await pairBytes(collectionPath)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Historical starter' })).not.toBeVisible()
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await expect(page.getByRole('heading', { name: 'Historical starter' })).toBeVisible()
  expect(await pairBytes(collectionPath)).toEqual(before)
  await saveBrowserCollection(page, data)
  await saveBrowserCollection(page, data)
  expect(await loadCollection(collectionPath)).toEqual(data)
  await page.reload()
  await page.getByRole('checkbox', { name: 'Show outdated' }).check()
  await expect(page.getByRole('heading', { name: 'Historical starter' })).toBeVisible()
})
