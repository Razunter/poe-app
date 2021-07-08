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
    <md-dialog :md-active.sync="showDialog" @md-clicked-outside="resetData">
      <md-dialog-title>{{ buildData.title }}</md-dialog-title>
      <md-tabs md-dynamic-height md-active-tab="tab-edit">
        <md-tab md-label="View">
          <h2 class="build__type">
            Type: {{ buildType }}
          </h2>
        </md-tab>
        <md-tab id="tab-edit" md-label="Edit">
          <form
            novalidate
            class="md-layout"
            @submit.prevent="formSubmit"
          >
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
            <md-autocomplete
              v-model="newBuildData.author"
              :md-options="authors"
            >
              <label>Author</label>
            </md-autocomplete>
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
            <md-chips
              v-model="newBuildData.versions"
              md-placeholder="Add version..."
              :class="{'md-invalid': $v.newBuildData.versions.$error}"
              :md-auto-insert="true"
            >
              <label>Supported versions</label>
              <span
                v-if="!$v.newBuildData.versions.required"
                class="md-error"
              >
                Required
              </span>
            </md-chips>
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
          versions: Array,
          author: String
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
      showDialog: false,
      buildData,
      newBuildData: Object.assign({}, buildData)
    }
  },
  computed: {
    authors () {
      return Array.from(this.$store.state.authors)
    }
  },
  methods: {
    formSubmit () {
      this.$v.$touch()
      if (!this.$v.$invalid) {
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
      versions: { required }
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

  &:hover, &:focus {
    background: rgba(255, 255, 255, .1);
  }

  &__row {
    display: grid;
    grid-template-columns: auto min-content 3em;
  }

  &__title {
    margin: 0 2rem 0 0;
  }

  &__videotype {
    margin: 0 2rem;
  }
}

.build--outdated {
  opacity: .6;
}
</style>

<style>
.md-menu-content {
  z-index: 12;
}
</style>
