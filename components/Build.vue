<template>
  <article
    class="build"
    :class="{ 'build--outdated' : outdated }"
    @click="showDialog = true"
  >
    <h3 class="build__title">
      {{ buildData.title }}
    </h3>
    <md-dialog :md-active.sync="showDialog">
      <md-dialog-title>{{ buildData.title }}</md-dialog-title>
      <md-tabs md-dynamic-height>
        <md-tab md-label="View">
          <h2 class="build__type">
            Type: {{ buildType }}
          </h2>
        </md-tab>
        <md-tab md-label="Edit">
          <form novalidate class="md-layout" @submit.prevent="formSubmit">
            <md-field :class="{'md-invalid': $v.newBuildData.title.$error}">
              <label for="build-title">Build title</label>
              <md-input
                id="build-title"
                v-model.trim="newBuildData.title"
                name="build-title"
                @input="$v.newBuildData.title.$touch()"
              />
              <span
                v-if="!$v.newBuildData.title.required"
                class="md-error"
              >
                Required
              </span>
            </md-field>
            <md-field :class="{'md-invalid': $v.newBuildData.url.$error}">
              <label for="build-url">Build URL</label>
              <md-input
                id="build-url"
                v-model.trim="newBuildData.url"
                name="build-url"
                @input="$v.newBuildData.url.$touch()"
              />
              <span
                v-if="!$v.newBuildData.url.required"
                class="md-error"
              >
                Required
              </span>
              <span
                v-else-if="!$v.newBuildData.url.url"
                class="md-error"
              >
                Must be an URL
              </span>
            </md-field>
            <md-button class="md-primary" type="submit">
              Save
            </md-button>
          </form>
        </md-tab>
      </md-tabs>
    </md-dialog>
  </article>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { required, url } from 'vuelidate/lib/validators'

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
          videotype: String,
          video: String,
          versions: Array
        }
      }
    }
  },
  data () {
    return {
      showDialog: false,
      buildData: this.build,
      newBuildData: Object.assign({}, this.build)
    }
  },
  methods: {
    formSubmit () {
      this.$v.$touch()
      if (!this.$v.$invalid) {
        this.buildData = Object.assign({}, this.newBuildData)
      }
    }
  },
  validations: {
    newBuildData: {
      title: { required },
      url: {
        required,
        url
      },
      videotype: { required },
      video: { required },
      versions: { required }
    }
  }
}
</script>

<style lang="scss">
.build {
  cursor: pointer;
}

.build--outdated {
  opacity: .6;
}
</style>
