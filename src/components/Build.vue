<template>
  <article
    class="build"
    :class="{ 'build--outdated' : outdated, 'build--skip' : buildData.skip }"
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
      <div
        v-if="buildData.versions"
        class="build__version"
      >
        {{ buildData.versions[buildData.versions.length - 1] }}
      </div>
      <div class="build__url">
        {{ buildData.url }}
      </div>
      <div class="build__info">
        <span
          :class="buildData.video && 'active'"
          class="build__video"
        >V</span>
        <span
          :class="(buildData.videothumb && buildData.videothumb['480w']) && 'active'"
          class="build_videothumb--480w"
        >
          T-480w
        </span>
        <span
          :class="(buildData.videothumb && buildData.videothumb['640w']) && 'active'"
          class="build_videothumb--640w"
        >
          T-640w
        </span>
        <span
          :class="(buildData.videothumb && buildData.videothumb['1280w']) && 'active'"
          class="build_videothumb--1280w"
        >
          T-1280w
        </span>
        <span
          :class="buildData.pin && 'active'"
          class="build__pinned"
        >P</span>
      </div>
    </div>
    <v-dialog
      v-if="showDialog"
      v-model="showDialog"
      max-width="1000px"
      scrollable="true"
      @click:outside="resetData"
    >
      <v-card>
        <v-card-title>Edit build</v-card-title>
        <v-card-text>
          <form
            novalidate
            class="md-layout"
            @submit.prevent="formSubmit"
          >
            <v-text-field
              v-model.trim="v$.newBuildData.title.$model"
              label="Build title"
              :error-messages="v$.newBuildData.title.$errors"
              required
              autocomplete="false"
            />
            <v-combobox
              v-model="newBuildData.author"
              :items="authors"
              clearable
              label="Author"
            />
            <v-text-field
              v-model.trim="v$.newBuildData.url.$model"
              label="Build URL"
              :error-messages="v$.newBuildData.url.$errors"
              required
            >
              <a
                slot="append"
                :href="newBuildData.url"
                target="_blank"
              >
                <v-icon>
                  mdi-open-in-new
                </v-icon>
              </a>
            </v-text-field>
            <v-text-field
              v-model.trim="v$.newBuildData.video.$model"
              label="Video URL"
              :error-messages="v$.newBuildData.video.$errors"
            />
            <v-combobox
              v-model="v$.newBuildData.versions.$model"
              label="Supported versions"
              placeholder="Add version..."
              :error-messages="v$.newBuildData.versions.$errors"
              multiple
              required
              chips
            />
            <v-switch
              v-model="newBuildData.pin"
              label="Pin build"
            />
            <v-switch
              v-model="newBuildData.skip"
              label="Skip build"
            />
            <input
              type="submit"
              value=""
              hidden
            >
          </form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="blue"
            @click="formSubmit"
          >
            Save
          </v-btn>
          <v-btn
            color="red"
            @click="$emit('update:delete'); showDialog = false;"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </article>
</template>

<script lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { decimal, required, url } from '@vuelidate/validators'
import compareVersions from 'compare-versions'
import { defineComponent } from 'vue'
import { BuildClass } from '../lib/BuildClass'
import { useStore } from '../store/authors'

export default defineComponent({
  props: {
    buildType: {
      default: '',
      required: true,
      type: String,
    },
    outdated: {
      default: true,
      type: Boolean,
    },
    build: {
      type: BuildClass,
      required: true,
    },
  },
  setup () {
    return {
      v$: useVuelidate(),
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
      newBuildData: { ...buildData },
    }
  },
  computed: {
    authors () {
      const store = useStore()
      return Array.from(store.authors)
    },
  },
  methods: {
    formSubmit () {
      this.v$.$touch()
      if (!this.v$.$invalid) {
        this.newBuildData.versions = this.newBuildData.versions.sort(compareVersions)
        this.buildData = { ...this.newBuildData }
        this.$emit('update:build', this.buildData)
        this.showDialog = false
      }
    },
    resetData () {
      this.newBuildData = { ...this.buildData }
    },
  },
  validations: {
    newBuildData: {
      title: { required },
      url: {
        required,
        url,
      },
      versions: {
        required,
        $each: { decimal },
      },
      video: {
        url,
      },
    },
  },
})
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
    grid-template-columns: auto min-content;
  }

  &__title {
    margin: 0 2rem 0 0;
    font-weight: 400;
  }

  &__author {
    font-weight: 600;
  }

  &__version {
    text-align: right;
  }

  &__url {
    font-size: .8em;
    color: gray;
  }

  &__info {
    display: flex;
    gap: 1em;
  }

  &__info {
    font-size: .8em;

    span {
      color: gray;

      &.active {
        color: forestgreen;
      }
    }
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

.build--skip {
  border-color: #cb4141;
}
</style>
