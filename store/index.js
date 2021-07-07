export const state = () => ({
  authors: new Set()
})

export const mutations = {
  add (state, newAuthor) {
    state.authors.add(newAuthor)
  },
  remove (state, removedAuthor) {
    state.authors.delete(removedAuthor)
  }
}
