import type { BuildClass } from './BuildClass'

export type BuildTypes = {
  [key: string]: string;
}

export type BuildList = Array<{
  type: string;
  builds: BuildClass[];
}>

export type Versions = {
  version: string;
  name: string;
  wip?: boolean;
  url?: string;
  note?: string;
  skiprf?: boolean;
}
