import type { FullConfig } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const runPattern = /^run-(\d{13})-[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/u
const maxAge = 7 * 24 * 60 * 60 * 1_000
process.env.POE_TEST_ARTIFACT_RUN ??= `run-${Date.now()}-${randomUUID()}`
const runName = process.env.POE_TEST_ARTIFACT_RUN
if (!runPattern.test(runName)) {
  throw new Error('Invalid browser test artifact run identity')
}

// Workers inherit this identity; config evaluation never creates or prunes directories.
export const testArtifactsDirectory = fileURLToPath(new URL(`../test-results/${runName}`, import.meta.url))

export const prepareTestArtifacts = (root: string, currentRun: string, now = Date.now()) => {
  if (!runPattern.test(currentRun)) {
    throw new Error('Invalid browser test artifact run identity')
  }

  mkdirSync(root, { recursive: true })
  if (!lstatSync(root).isDirectory()) {
    throw new Error('Browser test artifact root must be a real directory')
  }

  const currentDirectory = path.join(root, currentRun)
  mkdirSync(currentDirectory, { recursive: true })
  if (!lstatSync(currentDirectory).isDirectory()) {
    throw new Error('Browser test artifact run must be a real directory')
  }

  const previousRuns = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== currentRun && runPattern.test(entry.name))
    .map((entry) => ({ name: entry.name, created: Number(runPattern.exec(entry.name)?.[1]) }))
    .toSorted((a, b) => b.created - a.created || b.name.localeCompare(a.name))

  let retained = 0
  for (const run of previousRuns) {
    if (now - run.created > maxAge || retained >= 9) {
      rmSync(path.join(root, run.name), { recursive: true, force: true })
    } else {
      retained++
    }
  }
}

const testArtifacts = (config: FullConfig) => {
  // Inherited proof configs keep their explicitly selected evidence directories untouched.
  if (config.projects.some((project) => project.outputDir === testArtifactsDirectory)) {
    prepareTestArtifacts(path.dirname(testArtifactsDirectory), path.basename(testArtifactsDirectory))
  }
}

export default testArtifacts
