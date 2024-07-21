import { writable } from 'svelte/store'

export const log = writable<Log>(new Map([[new Date(), 'Init']]))
export const progressBar = writable<number>(0)
export const showOutdated = writable<boolean>(false)

export type Log = Map<Date, string>
