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
      <v-container>
        <v-row align="center" justify="center">
          <v-col class="py-0">
            <div class="mx-auto text-center">
              <span>&copy; {{ new Date().getFullYear() }} TeQu</span>
              <v-btn
                href="https://twitter.com/_TeQu_"
                target="_blank"
                icon
                link
                elevation="0"
                small
              >
                <v-icon color="#1DA1F2">mdi-twitter</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col class="py-0 pt-2">
            <div class="text-center">
              <a
                href="https://xumm.app/detect/request:rQQQrUdN1cLdNmxH4dHfKgmX5P4kf3ZrM"
                target="_blank"
              >
                <div
                  class="mx-auto xumm-donate-button"
                  style="width: 120px"
                ></div>
              </a>
            </div>
          </v-col>
        </v-row>
      </v-container>
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
