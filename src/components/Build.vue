<template>
  <article
    class="build"
    :class="{ 'build--outdated' : outdated, 'build--skip' : buildData.skip }"
    tabindex="0"
    @click="showDialog = true"
  >
    <div class="build__row">
      <h5 class="build__title">
        <template v-if="buildData.author">
          <span class="build__author">{{ buildData.author }}</span> -
        </template>
        {{ buildData.title }}
      </h5>
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
        >
          <q-icon name="mdi-pin" />
        </span>
      </div>
    </div>
    <q-dialog
      v-if="showDialog"
      v-model="showDialog"
      @click:outside="resetData"
    >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h4">
            Edit build
          </div>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit.prevent="formSubmit"
          >
            <q-input
              v-model.trim="newBuildData.title"
              label="Build title"
              required
              autocomplete="false"
              bottom-slots
              :rules="[val => !!val || 'Field is required']"
            />
            <q-select
              v-model="newBuildData.author"
              :options="authorsFiltered"
              clearable
              use-input
              new-value-mode="add-unique"
              input-debounce="0"
              label="Author"
              bottom-slots
              @filter="filterFn"
            />
            <q-input
              v-model.trim="newBuildData.url"
              label="Build URL"
              required
              bottom-slots
              :rules="[val => !!val || 'Field is required']"
            >
              <template #append>
                <q-btn
                  :href="newBuildData.url"
                  icon="mdi-open-in-new"
                  target="_blank"
                  flat
                  type="a"
                />
              </template>
            </q-input>
            <q-input
              v-model.trim="newBuildData.video"
              label="Video URL"
              bottom-slots
            />
            <q-select
              v-model="newBuildData.versions"
              label="Supported versions"
              new-value-mode="toggle"
              placeholder="Add version..."
              multiple
              required
              use-input
              use-chips
              bottom-slots
              :rules="[val => !!val || 'Field is required']"
            />
            <q-toggle
              v-model="newBuildData.pin"
              label="Pin build"
              bottom-slots
            />
            <q-toggle
              v-model="newBuildData.skip"
              label="Skip build"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            color="blue"
            @click="formSubmit"
          >
            Save
          </q-btn>
          <q-btn
            color="red"
            @click="$emit('update:delete'); showDialog = false;"
          >
            Delete
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </article>
</template>

<script lang="ts">
import compareVersions from 'compare-versions'
import type { PropType } from 'vue'
import { defineComponent, ref } from 'vue'
import type { BuildClass } from '@/lib/BuildClass'
import { useStore } from '@/store/authors'

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
      type: Object as PropType<BuildClass>,
      required: true,
    },
  },
  setup (props) {
    const buildData = props.build
    if (!buildData.versions) {
      buildData.versions = []
    }

    const store = useStore()
    const authors = Array.from(store.authors) as string[]
    const authorsFiltered = ref(authors)

    return {
      showDialog: ref(false),
      buildData: ref(buildData),
      newBuildData: ref({ ...buildData }),
      authors,
      authorsFiltered,

      filterFn (value: string, update: (argument: () => void) => void, abort: unknown) {
        update(() => {
          const needle = value.toLowerCase()
          authorsFiltered.value = authors.filter((filterValue: string) => {
            return filterValue.toLowerCase().includes(needle)
          })
        })
      },
    }
  },
  methods: {
    formSubmit () {
      this.newBuildData.versions.sort(compareVersions)
      this.buildData = { ...this.newBuildData }
      this.$emit('update:build', this.buildData)
      this.showDialog = false
    },
    resetData () {
      this.newBuildData = { ...this.buildData }
    },
  },
})
</script>

<style lang="scss" scoped>
.build {
  cursor: pointer;
  padding: .75rem 1rem;
  border: 1px solid #555;
  border-radius: .5rem;
  width: 100%;
  color: #fff;
  background: #151515;

  &:hover, &:focus {
    background: #242424;
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
