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
      scrollable
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
                  v-model="newCurrentVersion"
                  solo
                  :items="allVersions"
                  :error-messages="currentVersionErrors"
                  label="Current version"
                  @input="$v.newCurrentVersion.$touch()"
                  @blur="$v.newCurrentVersion.$touch()"
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
                <v-card
                  v-for="(version, index) in newVersions"
                  :key="index"
                >
                  <v-card-text>
                    <v-text-field
                      v-model.trim="version.version"
                      label="Version number"
                      :error-messages="versionErrors(index)"
                      required
                      autocomplete="false"
                      @input="$v.newVersions.$each[index].version.$touch()"
                      @blur="$v.newVersions.$each[index].version.$touch()"
                    />
                    <v-text-field
                      v-model.trim="version.name"
                      label="League name"
                      :error-messages="nameErrors(index)"
                      required
                      autocomplete="false"
                      @input="$v.newVersions.$each[index].name.$touch()"
                      @blur="$v.newVersions.$each[index].name.$touch()"
                    />
                    <v-text-field
                      v-model.trim="version.url"
                      label="Version URL"
                      :error-messages="urlErrors(index)"
                      autocomplete="false"
                      @input="$v.newVersions.$each[index].url.$touch()"
                      @blur="$v.newVersions.$each[index].url.$touch()"
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

<script>
import { decimal, required, url } from 'vuelidate/lib/validators'
import { validationMixin } from 'vuelidate'

export default {
  mixins: [validationMixin],
  props: {
    versions: {
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
      newVersions: this.versions.concat(),
      newCurrentVersion: this.currentVersion.concat(),
      showDialog: false
    }
  },
  computed: {
    allVersions () {
      const allV = this.newVersions.map((v) => {
        return v.version
      })
      return allV.slice().reverse()
    },
    nameErrors () {
      return (index) => {
        const errors = []
        if (!this.$v.newVersions.$each[index].name.$dirty) {
          return errors
        }
        !this.$v.newVersions.$each[index].name.required && errors.push('League name is required.')
        return errors
      }
    },
    urlErrors () {
      return (index) => {
        const errors = []
        if (!this.$v.newVersions.$each[index].url.$dirty) {
          return errors
        }
        !this.$v.newVersions.$each[index].url.url && errors.push('Must be an URL.')
        return errors
      }
    },
    versionErrors () {
      return (index) => {
        const errors = []
        if (!this.$v.newVersions.$each[index].version.$dirty) {
          return errors
        }
        !this.$v.newVersions.$each[index].version.required && errors.push('Version is required.')
        this.$v.newVersions.$each[index].version.$invalid && errors.push('Must be a decimal number.')
        return errors
      }
    },
    currentVersionErrors () {
      const errors = []
      if (!this.$v.newCurrentVersion.$dirty) {
        return errors
      }
      !this.$v.newCurrentVersion.required && errors.push('Current version is required.')
      this.$v.newCurrentVersion.$invalid && errors.push('Must be a decimal number.')
      return errors
    }
  },
  methods: {
    addNew () {
      this.newVersions.push({
        version: '',
        name: '',
        wip: false,
        url: '',
        note: ''
      })
    },
    formSubmit () {
      this.$v.$touch()
      if (!this.$v.$invalid) {
        this.$emit('update:versions', this.newVersions)
        this.$emit('update:currentVersion', this.newCurrentVersion)
        this.showDialog = false
      }
    }
  },
  validations: {
    newVersions: {
      $each: {
        name: {
          required
        },
        version: {
          required,
          decimal
        },
        url: {
          url
        }
      }
    },
    newCurrentVersion: {
      required,
      decimal
    }
  }
}
</script>
