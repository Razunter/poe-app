<template>
  <v-list-item @click="showDialog = true">
    <v-list-item-icon>
      <v-icon>mdi-cog</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Settings</v-list-item-title>
    </v-list-item-content>

    <v-dialog
      v-model="showDialog"
      max-width="1000px"
      scrollable="true"
    >
      <v-card>
        <v-card-title>Versions config</v-card-title>
        <v-card-text>
          <form
            novalidate
            class="md-layout"
            @submit.prevent="formSubmit"
          >
            <v-card>
              <v-card-title>Current version</v-card-title>
              <v-card-text>
                <v-select
                  v-model="v$.newCurrentVersion.$model"
                  solo
                  :items="allVersions"
                  :error-messages="v$.newCurrentVersion.$errors"
                  label="Current version"
                />
              </v-card-text>
            </v-card>
            <v-card>
              <v-card-title>Versions</v-card-title>
              <v-card-actions>
                <v-btn @click="addNew">
                  Add new
                </v-btn>
              </v-card-actions>
              <v-card-text
                style="display: flex; flex-direction: column-reverse;"
              >
                <ValidateEach
                  v-for="(version, index) in newVersions"
                  :key="index"
                  :state="version"
                  :rules="validationRules"
                >
                  <template #default="{ v$ }">
                    <v-card>
                      <v-card-text>
                        <v-text-field
                          v-model.trim="v$.newVersions.version.$errors"
                          label="Version number"
                          :error-messages="v$.newVersions.version.$errors"
                          required
                          autocomplete="false"
                        />
                        <v-text-field
                          v-model.trim="version.name"
                          label="League name"
                          :error-messages="nameErrors(index)"
                          required
                          autocomplete="false"
                          @input="v$.newVersions.$each[index].name.$touch()"
                          @blur="v$.newVersions.$each[index].name.$touch()"
                        />
                        <v-text-field
                          v-model.trim="version.url"
                          label="Version URL"
                          :error-messages="urlErrors(index)"
                          autocomplete="false"
                          @input="v$.newVersions.$each[index].url.$touch()"
                          @blur="v$.newVersions.$each[index].url.$touch()"
                        />
                        <v-switch
                          v-model="version.wip"
                          label="Work in progress"
                        />
                        <v-text-field
                          v-model.trim="version.note"
                          label="Note"
                        />
                      </v-card-text>
                      <v-card-actions>
                        <v-btn>Delete</v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </ValidateEach>
              </v-card-text>
            </v-card>
          </form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="formSubmit">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-list-item>
</template>

<script lang="ts">
import { ValidateEach } from '@vuelidate/components'
import type { ValidationArgs } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { decimal, required, url } from '@vuelidate/validators'
import { defineComponent } from 'vue'
import type { Versions } from '../lib/dataTypes'

export default defineComponent({
  components: {
    ValidateEach,
  },
  setup (props) {
    const validationRules = {
      newVersions: {
        name: {
          required,
        },
        version: {
          required,
          decimal,
        },
        url: {
          url,
        },
      },
      newCurrentVersion: {
        required,
        decimal,
      },
    }

    return {
      validationRules,
      v$: useVuelidate(),
      newVersions: props.versions ? props.versions.concat() : [],
      newCurrentVersion: props.currentVersion ? props.currentVersion.concat() : '',
      showDialog: false,
    } as {
      validationRules: ValidationArgs;
      v$: ReturnType<typeof useVuelidate>;
      newVersions: Versions[];
      newCurrentVersion: string;
      showDialog: boolean;
    }
  },
  props: {
    versions: {
      default: () => {
        return []
      },
      type: Array,
    },
    currentVersion: {
      type: String,
      default: '',
    },
  },
  computed: {
    allVersions () {
      const allV = this.newVersions.map((thisV) => {
        return thisV.version
      })
      return allV.slice()
        .reverse()
    },
    nameErrors () {
      return (index: number) => {
        const errors: string[] = []
        if (!this.v$.newVersions.$each[index].name.$dirty) {
          return errors
        }

        // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
        !this.v$.newVersions.$each[index].name.required && errors.push('League name is required.')
        return errors
      }
    },
    urlErrors () {
      return (index) => {
        const errors = []
        if (!this.v$.newVersions.$each[index].url.$dirty) {
          return errors
        }

        // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
        !this.v$.newVersions.$each[index].url.url && errors.push('Must be an URL.')
        return errors
      }
    },
    versionErrors () {
      return (index) => {
        const errors = []
        if (!this.v$.newVersions.$each[index].version.$dirty) {
          return errors
        }

        // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
        !this.v$.newVersions.$each[index].version.required && errors.push('Version is required.')
        // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
        this.v$.newVersions.$each[index].version.$invalid && errors.push('Must be a decimal number.')
        return errors
      }
    },
    currentVersionErrors () {
      const errors = []
      if (!this.v$.newCurrentVersion.$dirty) {
        return errors
      }

      // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
      !this.v$.newCurrentVersion.required && errors.push('Current version is required.')
      // eslint-disable-next-line @babel/no-unused-expressions, @typescript-eslint/no-unused-expressions
      this.v$.newCurrentVersion.$invalid && errors.push('Must be a decimal number.')
      return errors
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
    formSubmit () {
      this.v$.$touch()
      if (!this.v$.$invalid) {
        this.$emit('update:versions', this.newVersions)
        this.$emit('update:currentVersion', this.newCurrentVersion)
        this.showDialog = false
      }
    },
  },
})
</script>
