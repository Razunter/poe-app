export class Build {
  public title: string

  public url: string

  public video?: string

  public videothumb?: {
    '480w'?: string;
    '640w'?: string;
    '1280w'?: string;
  }

  public versions: string[]

  public author?: string

  public pin?: boolean

  public skip: boolean | undefined

  public constructor(buildObject?: Partial<Build>) {
    this.title = buildObject?.title ?? ''
    this.url = buildObject?.url ?? ''

    if (buildObject?.video) {
      this.video = buildObject.video
    }

    if (typeof buildObject?.videothumb === 'object' && Object.keys(buildObject.videothumb).length > 0) {
      this.videothumb = buildObject.videothumb
    }

    this.versions = buildObject?.versions ?? []

    this.author = buildObject?.author
    this.pin = buildObject?.pin
    this.skip = buildObject?.skip
  }
}
