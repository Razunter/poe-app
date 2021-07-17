<template>
  <v-list-item @click="syncBuilds">
    <v-list-item-icon>
      <v-icon>mdi-earth</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Sync builds</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
const { ApiClient } = require('twitch')
const { ClientCredentialsAuthProvider } = require('twitch-auth')
const cheerio = require('cheerio')

const clientId = 'y6os8vq0rmevgsgrm3ktlgncgjqkn9'
const clientSecret = 'oelwmcf3bykgliz9ogxd5ba9n4xfrj'
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
  methods: {
    outdated (versions) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    syncBuilds () {
      this.buildList.forEach(async (buildCat) => {
        // noinspection ES6MissingAwait
        await buildCat.builds.forEach(async (build) => {
          // noinspection ES6MissingAwait
          if (this.outdated(build.versions) && build.url.indexOf('pathofexile.com') > 0) {
            const addr = build.url.substring(build.url.indexOf('/forum/') + 7)
            await this.$http.$get('/forum/' + addr).then((response) => {
              const $ = cheerio.load(response.data)
              const title = $('title').text()
              const regex = /[0-9].[0-9]+/gu
              const versionNew = regex.exec(title)
              regex.lastIndex = 0
              if (versionNew !== null) {
                if (!build.versions.includes(versionNew[0])) {
                  build.versions.push(versionNew[0])
                  console.log(`Updated: ${build.title}\n${build.url}`)
                }
              } else {
                console.error('not found: ' + build.url)
              }
            })
              .catch(function (error) {
                // handle error
                console.log(error)
              })
          }

          // Twitch
          if (build.video.indexOf('twitch.tv') > 0 && !build.videothumb) {
            const videoID = build.video.substr(build.video.lastIndexOf('/') + 1)
            const video = await apiClient.helix.videos.getVideoById(videoID)
            if (!video) {
              console.log('Twitch video not found: ' + build.video)
              return false
            }
            build.videothumb = video.thumbnailUrl
          }
        })
      })
      this.$emit('update:buildList', this.buildList)
    }
  }
}
</script>
