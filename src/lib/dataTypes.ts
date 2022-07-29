import type { Build } from './Build'

export type BuildTypes = {
  [key: string]: string;
}

export type BuildCategory = {
  type: string;
  builds: Build[];
}

export type BuildList = BuildCategory[]

export type Versions = {
  version: string;
  name: string;
  wip?: boolean;
  url?: string;
  note?: string;
  skiprf?: boolean;
  compatible?: string[];
}
