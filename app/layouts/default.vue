<template>
  <v-app dark>
    <v-app-bar app absolute>
      <v-toolbar-title class="mx-auto" v-text="title" />
    </v-app-bar>
    <v-main>
      <v-container>
        <nuxt />
      </v-container>
    </v-main>
    <v-footer app absolute>
      <div class="mx-auto">
        <span>&copy; {{ new Date().getFullYear() }} develoQ</span>
        <v-btn
          href="https://twitter.com/XR_Q_P"
          target="_blank"
          icon
          link
          elevation="0"
          small
        >
          <v-icon color="#1DA1F2">mdi-twitter</v-icon>
        </v-btn>
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
