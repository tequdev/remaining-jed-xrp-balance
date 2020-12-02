<template>
  <v-app dark>
    <v-app-bar fixed app>
      <v-toolbar-title class="mx-auto" v-text="title" />
    </v-app-bar>
    <v-main>
      <v-container>
        <nuxt />
      </v-container>
    </v-main>
    <v-footer app>
      <div class="mx-auto">
        <span>&copy; {{ new Date().getFullYear() }} develoQ</span>
      </div>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
@Component({})
export default class extends Vue {
  get title() {
    return 'Jed Balance'
  }
}
</script>
