export type GuideVersion =
  { outcome: 'ambiguous'; versions: string[] } | { outcome: 'found'; version: string } | { outcome: 'missing' }

export type GuideSource = { name: string; host: RegExp; route?: RegExp; label?: RegExp }

const guideSources: GuideSource[] = [
  {
    name: 'Path of Exile forum',
    host: /^(?:[a-z]{2,3}\.)?pathofexile\.com$/u,
    route: /^\/forum\/view-thread\/\d+(?:\/page\/\d+)?\/?$/u,
  },
  {
    name: 'Maxroll',
    host: /^(?:www\.)?maxroll\.gg$/u,
    route: /^\/poe\/build-guides\/[^/]+\/?$/u,
    // The class hash suffix is generated per build, so only the stable prefix is matched.
    label: /<[^<>]*\bclass="[^"]*_Tags__tag_[^"]*"[^<>]*>([^<]*)</gu,
  },
  {
    name: 'PoE Vault',
    host: /^(?:www\.)?poe-vault\.com$/u,
    route: /^\/guides\/[^/]+\/?$/u,
  },
  // Ordinary requests get a Cloudflare challenge, so no route is supported.
  { name: 'Mobalytics', host: /^(?:www\.)?mobalytics\.gg$/u },
]

export const classifyGuideUrl = (url: string) => {
  if (!URL.canParse(url)) {
    return undefined
  }

  const { protocol, hostname, pathname } = new URL(url)
  if (protocol !== 'http:' && protocol !== 'https:') {
    return undefined
  }

  const source = guideSources.find((candidate) => candidate.host.test(hostname))
  if (!source) {
    return undefined
  }

  return { source, supported: source.route?.test(pathname) ?? false }
}
