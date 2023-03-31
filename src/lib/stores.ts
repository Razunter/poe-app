import {writable} from 'svelte/store'

export const log = writable<LogType>()

export type LogType = Map<Date, string>
