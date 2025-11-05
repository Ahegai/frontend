<template>
  <v-app :class="appClass">
    <router-view />
  </v-app>
</template>

<script setup>
  import { computed } from 'vue'
  import { useTheme } from 'vuetify'
  import { useBroadcastStore } from '@/stores/broadcast'
  import { useWhatsappStore } from '@/stores/whatsapp'

  const whatsappStore = useWhatsappStore()
  whatsappStore.initializeListeners()
  whatsappStore.checkStatus()

  const broadcastStore = useBroadcastStore()
  broadcastStore.initializeListeners()
  const theme = useTheme()
  const appClass = computed(() => (theme.global.name.value === 'dark' ? 'theme-dark' : 'theme-light'))
</script>

<style lang="scss">
  .v-main.theme-light {
    background-color: #F5F5F5;
  }

  .v-main.theme-dark {
    background-color: #EEEEEE; /* slightly different for dark (as requested) */
  }
</style>
