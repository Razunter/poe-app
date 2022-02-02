<template>
  <q-item
    v-ripple
    clickable
    @click="syncBuilds"
  >
    <q-item-section avatar>
      <q-icon
        color="white"
        name="mdi-earth"
      />
    </q-item-section>
    <q-item-section>
      Sync builds
    </q-item-section>
  </q-item>
  <q-linear-progress
    v-if="progressbar > 0 && progressbar < 1"
    :value="progressbar"
    color="white"
    track-color="green"
  />
</template>

<script lang="ts">
import axios from 'axios'
import { load as CheerioLoad } from 'cheerio'
import type { PropType} from 'vue'
import { defineComponent, ref } from 'vue'
import { useToast } from 'vue-toastification'
import type { BuildList } from '@/lib/dataTypes'

export default defineComponent({
  props: {
    buildList: {
      default: () => {
        return [] as BuildList
      },
      type: Array as PropType<BuildList>,
    },
    currentVersion: {
      type: String,
      default: '',
    },
  },
  setup () {
    const toast = useToast()

    return {
      toast,
      progressbar: ref(0),
    }
  },
  methods: {
    outdated (versions: string[]) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    syncBuilds () {
      this.progressbar = 0
      let buildCount = 0
      const buildPromises = []
      for (const buildCat of this.buildList) {
        for (const build of buildCat.builds) {
          // PoE Forum & PoE-vault
          const asyncPoEforumvault = async () => {
            if (this.outdated(build.versions)) {
              let apiAddress = ''
              if (build.url.includes('pathofexile.com')) {
                const address = build.url.slice(Math.max(0, build.url.indexOf('/forum/') + 7))
                apiAddress = '/forum/' + address
              } else if (build.url.includes('poe-vault.com')) {
                const address = build.url.slice(Math.max(0, build.url.indexOf('/guides/') + 8))
                apiAddress = '/guides/' + address
              } else {
                return true
              }

              await axios.get(apiAddress)
                .then((response) => {
                  const $ = CheerioLoad(response.data)
                  const title = $('title')
                    .text()
                  const regex = /[\d].[\d]+/gu
                  const versionNew = regex.exec(title)
                  regex.lastIndex = 0
                  if (versionNew === null) {
                    this.toast.error('Build or version not found: ' + build.title, {
                      timeout: false,
                    })
                  } else if (!build.versions.includes(versionNew[0])) {
                    build.versions.push(versionNew[0])
                    this.toast.success(`Updated: ${build.title}\n${build.url}`)
                  }
                })
                .catch((error) => {
                  // handle error
                  this.toast.error(error.message + '<br />' + build.title)
                })
            }

            return true
          }

          // YT
          const asyncYtTwitch = async () => {
            if (build.video && build.video.indexOf('youtube.com') > 0) {
              const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('?v=') + 3))

              if (build.videothumb?.['480w'] && !build.videothumb['480w'].includes(videoID)) {
                build.videothumb = {}
              }

              if (!build.videothumb || Object.keys(build.videothumb).length === 0) {
                await axios.get('/api/youtube', {
                  params: { videoID },
                })
                  .then(({ data }) => {
                    if (data.items.length > 0) {
                      const thumbs = data.items[0].snippet.thumbnails
                      build.videothumb = {
                        '480w': thumbs.high.url,
                      }
                      if (thumbs.standard) {
                        build.videothumb['640w'] = thumbs.standard.url
                      }

                      if (thumbs.maxres) {
                        build.videothumb['1280w'] = thumbs.maxres.url
                      }
                    } else {
                      build.video = ''
                      build.videothumb = {}
                      this.toast.error('YouTube video not found: ' + build.title, {
                        timeout: false,
                      })
                    }
                  })
                  .catch((error) => {
                    // handle error
                    this.toast.error(error.message + '<br />' + build.title)
                  })
              }
            } else if (build.video?.includes('twitch.tv') && !build.videothumb) {
              const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('/') + 1))
              const { data: video } = await axios.get('/api/twitch', {
                params: { videoID },
              })
              if (!video) {
                this.toast.error('Twitch video not found: ' + build.video, {
                  timeout: false,
                })
                return false
              }

              // eslint-disable-next-line require-atomic-updates
              build.videothumb = {
                '480w': video.thumbnailUrl.replace('%{width}', '480')
                  .replace('%{height}', '360'),
                '640w': video.thumbnailUrl.replace('%{width}', '640')
                  .replace('%{height}', '480'),
                '1280w': video.thumbnailUrl.replace('%{width}', '1280')
                  .replace('%{height}', '720'),
              }
            }

            return true
          }

          // eslint-disable-next-line @typescript-eslint/no-loop-func
          buildPromises.push(new Promise<void>((resolve, reject) => {
            void Promise.allSettled([asyncPoEforumvault(), asyncYtTwitch()])
              .then(() => {
                buildCount++
                this.progressbar = 1 - Math.floor((buildPromises.length - buildCount) / buildPromises.length)
                resolve()
              })
          }))
        }
      }

      void Promise.allSettled(buildPromises)
        .then(() => {
          this.progressbar = 1
          this.toast.success('Sync complete')
          this.$emit('update:buildList', this.buildList)
        })
    },
  },
})
</script>
