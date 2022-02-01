import { defineStore } from 'pinia'

export const useStore = defineStore('authors', {
  state: () => {
    return {
      authors: new Set(),
    }
  },
})
