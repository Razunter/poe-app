import { type Writable, writable } from 'svelte/store'

export const log = writable<Log>()
export const progressBar = writable<number>()
export const showOutdated = writable<boolean>()

export type Log = Map<Date, string>
export type WritableLog = Writable<Log>
