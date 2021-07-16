<template>
  <article
    class="build"
    :class="{ 'build--outdated' : outdated }"
    tabindex="0"
    @click="showDialog = true"
  >
    <div class="build__row">
      <h3 class="build__title">
        <template v-if="buildData.author">
          <span class="build__author">{{ buildData.author }}</span> -
        </template>
        {{ buildData.title }}
      </h3>
      <div class="build__videotype">
        {{ buildData.videotype }}
      </div>
      <div v-if="buildData.versions" class="build__version">
        {{ buildData.versions[buildData.versions.length - 1] }}
      </div>
    </div>
    <v-dialog
      v-model="showDialog"
      max-width="1000px"
      scrollable
      @click:outside="resetData"
    >
      <v-card>
        <v-card-title>{{ buildData.title }}</v-card-title>
        <v-card-text>
          <v-tabs v-model="tab">
            <v-tab key="edit">
              Edit
            </v-tab>
            <v-tab key="view">
              View
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item key="edit">
              <v-card flat>
                <v-card-text>
                  <form
                    novalidate
                    class="md-layout"
                    @submit.prevent="formSubmit"
                  >
                    <v-text-field
                      v-model.trim="newBuildData.title"
                      label="Build title"
                      :error-messages="titleErrors"
                      required
                      autocomplete="false"
                      @input="$v.newBuildData.title.$touch()"
                      @blur="$v.newBuildData.title.$touch()"
                    />
                    <v-combobox
                      v-model="newBuildData.author"
                      :items="authors"
                      clearable
                      label="Author"
                    />
                    <v-text-field
                      v-model.trim="newBuildData.url"
                      label="Build URL"
                      :error-messages="urlErrors"
                      required
                      @input="$v.newBuildData.url.$touch()"
                      @blur="$v.newBuildData.url.$touch()"
                    />
                    <v-text-field
                      v-model.trim="newBuildData.video"
                      label="Video URL"
                      :error-messages="videoErrors"
                      @input="$v.newBuildData.video.$touch()"
                      @blur="$v.newBuildData.video.$touch()"
                    />
                    <v-text-field
                      v-model.trim="newBuildData.videothumb"
                      label="Video Thumbnail URL"
                      :error-messages="videoThumbErrors"
                      @input="$v.newBuildData.videothumb.$touch()"
                      @blur="$v.newBuildData.videothumb.$touch()"
                    />
                    <v-combobox
                      v-model="newBuildData.versions"
                      label="Supported versions"
                      placeholder="Add version..."
                      :error-messages="versionsErrors"
                      multiple
                      required
                      chips
                      @input="$v.newBuildData.versions.$touch()"
                      @blur="$v.newBuildData.versions.$touch()"
                    />
                    <v-switch
                      v-model="newBuildData.pin"
                      label="Pin build"
                    />
                    <v-btn type="submit">
                      Save
                    </v-btn>
                  </form>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="view">
              <v-card flat>
                <v-card-text>
                  <h2 class="build__type">
                    Type: {{ buildType }}
                  </h2>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>
      </v-card>
    </v-dialog>
  </article>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { decimal, required, url } from 'vuelidate/lib/validators'
import compareVersions from 'compare-versions'

export default {
  mixins: [validationMixin],
  props: {
    buildType: {
      default: '',
      required: true,
      type: String
    },
    outdated: {
      default: true,
      type: Boolean
    },
    build: {
      type: Object,
      required: true,
      default () {
        return {
          title: String,
          url: String,
          video: String,
          videothumb: String,
          versions: Array,
          author: String,
          pin: Boolean
        }
      }
    }
  },
  data () {
    const buildData = this.build
    if (!buildData.versions) {
      buildData.versions = []
    }
    return {
      tab: null,
      showDialog: false,
      buildData,
      newBuildData: Object.assign({}, buildData)
    }
  },
  computed: {
    authors () {
      return Array.from(this.$store.state.authors)
    },
    titleErrors () {
      const errors = []
      if (!this.$v.newBuildData.title.$dirty) {
        return errors
      }
      !this.$v.newBuildData.title.required && errors.push('Title is required.')
      return errors
    },
    urlErrors () {
      const errors = []
      if (!this.$v.newBuildData.url.$dirty) {
        return errors
      }
      !this.$v.newBuildData.url.required && errors.push('URL is required.')
      !this.$v.newBuildData.url.url && errors.push('Must be an URL.')
      return errors
    },
    videoErrors () {
      const errors = []
      if (!this.$v.newBuildData.video.$dirty) {
        return errors
      }
      !this.$v.newBuildData.video.url && errors.push('Must be an URL.')
      return errors
    },
    videoThumbErrors () {
      const errors = []
      if (!this.$v.newBuildData.videothumb.$dirty) {
        return errors
      }
      !this.$v.newBuildData.videothumb.url && errors.push('Must be an URL.')
      return errors
    },
    versionsErrors () {
      const errors = []
      if (!this.$v.newBuildData.versions.$dirty) {
        return errors
      }
      !this.$v.newBuildData.versions.required && errors.push('Version is required.')
      this.$v.newBuildData.versions.$each.$invalid && errors.push('Must be a decimal number.')
      return errors
    }
  },
  methods: {
    formSubmit () {
      this.$v.$touch()
      if (!this.$v.$invalid) {
        this.newBuildData.versions = this.newBuildData.versions.sort(compareVersions)
        this.buildData = Object.assign({}, this.newBuildData)
        this.$emit('update:build', this.buildData)
        this.showDialog = false
      }
    },
    resetData () {
      this.newBuildData = Object.assign({}, this.buildData)
    }
  },
  validations: {
    newBuildData: {
      title: { required },
      url: {
        required,
        url
      },
      versions: {
        required,
        $each: { decimal }
      },
      videothumb: {
        url
      },
      video: {
        url
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.build {
  cursor: pointer;
  padding: .75rem 1rem;
  border: 1px solid #ccc;
  border-radius: .5rem;
  width: 100%;
  color: #fff;

  &:hover, &:focus {
    background: rgba(255, 255, 255, .1);
  }

  &__row {
    display: grid;
    grid-template-columns: auto min-content 3em;
  }

  &__title {
    margin: 0 2rem 0 0;
    font-weight: 400;
  }

  &__author {
    font-weight: 600;
  }

  &__videotype {
    margin: 0 2rem;
  }
}

.theme--dark.error--text {
  color: red;

  .v-messages__message {
    color: red;
  }
}

.build--outdated {
  opacity: .6;
}
</style>
