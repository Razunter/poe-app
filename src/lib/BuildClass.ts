export class BuildClass {
  public title = ''

  public url = ''

  public video = ''

  public videothumb?: {
    '480w'?: string;
    '640w'?: string;
    '1280w'?: string;
  }

  public versions: string[] = []

  public author?: string

  public pin?: boolean

  public skip?: boolean

  public constructor ({
    title,
    url,
    video,
    videothumb,
    versions,
    author,
    pin,
    skip,
  }: Partial<BuildClass>) {
    if (title) {
      this.title = title
    }

    if (url) {
      this.url = url
    }

    if (video) {
      this.video = video
    }

    if (typeof videothumb === 'object' && Object.keys(videothumb).length > 0) {
      this.videothumb = videothumb
    }

    if (versions) {
      this.versions = versions
    }

    this.author = author
    this.pin = pin
    this.skip = skip
  }
}
