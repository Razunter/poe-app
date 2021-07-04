<template>
  <Nuxt />
</template>

<script>
export default {
  css: [
    '~modern-normalize/modern-normalize.css'
  ],
  head () {
    return {
      link: [
        {
          rel: 'stylesheet',
          href: '//fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons'
        }]
    }
  }
}
</script>

<style lang="scss">

</style>
