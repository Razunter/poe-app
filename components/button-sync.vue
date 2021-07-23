<template>
  <v-list-item @click="syncBuilds">
    <v-list-item-icon>
      <v-icon>mdi-earth</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Sync builds</v-list-item-title>
      <v-progress-linear
        v-if="progressbar > 0 && progressbar < 100"
        :value="progressbar"
        background-color="white"
        color="green"
      />
    </v-list-item-content>
  </v-list-item>
</template>

<script>
const { ApiClient } = require('twitch')
const { ClientCredentialsAuthProvider } = require('twitch-auth')
const cheerio = require('cheerio')

const clientId = 'y6os8vq0rmevgsgrm3ktlgncgjqkn9'
const clientSecret = 'oelwmcf3bykgliz9ogxd5ba9n4xfrj'
const YTapiKey = 'AIzaSyCDyK-x9J6LK9TbVpKg69MtTNuN4pTfWnU'
const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret)
const apiClient = new ApiClient({ authProvider })

export default {
  props: {
    buildList: {
      default: () => {
        return []
      },
      type: Array
    },
    currentVersion: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      progressbar: 0
    }
  },
  methods: {
    outdated (versions) {
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
              let apiAddr = ''
              if (build.url.includes('pathofexile.com')) {
                const addr = build.url.substring(build.url.indexOf('/forum/') + 7)
                apiAddr = '/forum/' + addr
              } else if (build.url.includes('poe-vault.com')) {
                const addr = build.url.substring(build.url.indexOf('/guides/') + 8)
                apiAddr = '/guides/' + addr
              } else {
                return null
              }
              await this.$http.$get(apiAddr).then((response) => {
                const $ = cheerio.load(response)
                const title = $('title').text()
                const regex = /[0-9].[0-9]+/gu
                const versionNew = regex.exec(title)
                regex.lastIndex = 0
                if (versionNew !== null) {
                  if (!build.versions.includes(versionNew[0])) {
                    build.versions.push(versionNew[0])
                    this.$toast.success(`Updated: ${build.title}\n${build.url}`)
                  }
                } else {
                  this.$toast.error('Build or version not found: ' + build.title, {
                    duration: Infinity,
                    action: {
                      text: 'Close',
                      onClick: (e, toastObject) => {
                        toastObject.goAway(0)
                      }
                    }
                  })
                }
              })
                .catch((error) => {
                  // handle error
                  this.$toast.error(error.message + '<br />' + build.title)
                })
            }
          }

          // YT
          const asyncYt = async () => {
            if (build.video && build.video.indexOf('youtube.com') > 0) {
              const videoID = build.video.substr(build.video.lastIndexOf('?v=') + 3)

              if (build.videothumb && build.videothumb['480w'] && !build.videothumb['480w'].includes(videoID)) {
                build.videothumb = {}
              }

              if (!build.videothumb || Object.keys(build.videothumb).length === 0) {
                await this.$http.$get(`/youtube/v3/videos?id=${videoID}&key=${YTapiKey}&part=snippet`).then((response) => {
                  if (response.items.length > 0) {
                    const thumbs = response.items[0].snippet.thumbnails
                    build.videothumb = {
                      '480w': thumbs.high.url
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
                    this.$toast.error('YouTube video not found: ' + build.title, {
                      duration: Infinity,
                      action: {
                        text: 'Close',
                        onClick: (e, toastObject) => {
                          toastObject.goAway(0)
                        }
                      }
                    })
                  }
                }).catch((error) => {
                  // handle error
                  this.$toast.error(error.message + '<br />' + build.title)
                })
              }
            }
          }

          // Twitch
          const asyncTwitch = async () => {
            if (build.video && build.video.includes('twitch.tv') && !build.videothumb) {
              const videoID = build.video.substr(build.video.lastIndexOf('/') + 1)
              const video = await apiClient.helix.videos.getVideoById(videoID)
              if (!video) {
                this.$toast.error('Twitch video not found: ' + build.video, {
                  duration: Infinity,
                  action: {
                    text: 'Close',
                    onClick: (e, toastObject) => {
                      toastObject.goAway(0)
                    }
                  }
                })
                return false
              }
              build.videothumb = {
                '480w': video.thumbnailUrl.replace('%{width}', '480').replace('%{height}', '360'),
                '640w': video.thumbnailUrl.replace('%{width}', '640').replace('%{height}', '480'),
                '1280w': video.thumbnailUrl.replace('%{width}', '1280').replace('%{height}', '720')
              }
            }
          }

          buildPromises.push(new Promise((resolve, reject) => {
            Promise.allSettled([asyncPoEforumvault(), asyncYt(), asyncTwitch()]).then(() => {
              buildCount++
              this.progressbar = 100 - Math.floor((buildPromises.length - buildCount) / buildPromises.length * 100)
              resolve()
            })
          }))
        }
        Promise.allSettled(buildPromises).then(() => {
          this.progressbar = 100
          this.$toast.success('Sync complete')
          this.$emit('update:buildList', this.buildList)
        })
      }
    }
  }
}
</script>
