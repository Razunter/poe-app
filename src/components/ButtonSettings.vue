<template>
  <q-item
    v-ripple
    clickable
    @click="showDialog = true"
  >
    <q-item-section avatar>
      <q-icon
        color="white"
        name="mdi-cog"
      />
    </q-item-section>
    <q-item-section>
      Settings
    </q-item-section>

    <q-dialog
      v-model="showDialog"
      @hide="reset()"
    >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h5">
            Versions config
          </div>
        </q-card-section>

        <div class="scroll" style="max-height: 60vh">
          <q-card-section class="q-gutter-md">
            <q-card bordered flat>
              <q-card-section>
                <div class="text-h6">
                  Current version
                </div>
              </q-card-section>
              <q-card-section>
                <q-select
                  v-model="newCurrentVersion"
                  :options="allVersions"
                  label="Current version"
                  :rules="[ val => !!val ?? 'Required' ]"
                />
              </q-card-section>
            </q-card>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-h6">
              Versions
            </div>
          </q-card-section>

          <q-card-actions class="addNew-wrap">
            <q-btn color="green" @click="addNew">
              Add new
            </q-btn>
          </q-card-actions>

          <q-separator spaced />

          <q-card-section
            style="display: flex; flex-direction: column-reverse;"
            class="q-gutter-md"
          >
            <q-card
              v-for="version in newVersions"
              :key="version.version"
              flat
              bordered
            >
              <q-card-section>
                <q-input
                  v-model.trim="version.version"
                  for="version"
                  mask="#.##"
                  maxlength="3"
                  label="Version number"
                  autocomplete="false"
                  bottom-slots
                  :rules="[val => !!val || 'Field is required']"
                />
                <q-input
                  v-model.trim="version.name"
                  for="name"
                  label="League name"
                  autocomplete="false"
                  bottom-slots
                />
                <q-input
                  v-model.trim="version.url"
                  label="Version URL"
                  type="url"
                  autocomplete="false"
                  bottom-slots
                  :rules="[
                    val => !!val || 'Field is required',
                  ]"
                />
                <q-toggle
                  v-model="version.wip"
                  label="Work in progress"
                  bottom-slots
                />
                <q-input
                  v-model.trim="version.note"
                  label="Note"
                  bottom-slots
                />
              </q-card-section>
              <q-card-actions align="right">
                <q-btn color="red" @click="deleteVersion(version)">
                  Delete
                </q-btn>
              </q-card-actions>
            </q-card>
          </q-card-section>
        </div>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            v-close-popup
            flat
            label="Cancel"
          />
          <q-btn
            color="green"
            label="Save"
            @click="formSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-item>
</template>

<script lang="ts">
import type { PropType, Ref } from 'vue'
import { defineComponent, ref } from 'vue'
import type { Versions } from '@/lib/dataTypes'

export default defineComponent({
  props: {
    versions: {
      default: () => {
        return [] as Versions[]
      },
      type: Array as PropType<Versions[]>,
    },
    currentVersion: {
      type: String,
      default: '',
    },
  },
  setup (props) {
    return {
      newVersions: ref(props.versions ? props.versions.concat() : []),
      newCurrentVersion: ref(props.currentVersion ? props.currentVersion.concat() : ''),
      showDialog: ref(false),
    } as {
      newVersions: Ref<Versions[]>;
      newCurrentVersion: Ref<string>;
      showDialog: Ref<boolean>;
    }
  },
  computed: {
    allVersions () {
      const allV = this.newVersions.map((thisV) => {
        return thisV.version
      })
      return allV.slice()
        .reverse()
    },
  },
  methods: {
    addNew () {
      this.newVersions.push({
        version: '',
        name: '',
        wip: false,
        url: '',
        note: '',
      } as Versions)
    },
    deleteVersion (version: Versions) {
      const index = this.newVersions.indexOf(version)
      this.newVersions.splice(index)
    },
    formSubmit () {
      this.$emit('update:versions', this.newVersions)
      this.$emit('update:currentVersion', this.newCurrentVersion)
      this.showDialog = false
    },
    reset () {
      this.newVersions = this.versions ? this.versions.concat() : []
      this.newCurrentVersion = this.currentVersion ? this.currentVersion.concat() : ''
    },
  },
})
</script>

<style lang="scss" scoped>
.addNew-wrap {
  padding-left: $space-base;
  padding-right: $space-base;
}
</style>
