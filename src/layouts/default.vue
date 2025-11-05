<template>
  <v-layout class="overflow-hidden">
    <v-navigation-drawer
      class="elevation-1"
      color="indigo-darken-1"
      expand-on-hover
      permanent
      rail
    >
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-multicast"
          title="Рассылка"
          to="/broadcast"
          value="broadcast"
        />
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Клиенты"
          to="/clients"
          value="clients"
        />
        <v-list-item
          prepend-icon="mdi-earth"
          title="Страны"
          to="/countries"
          value="countries"
        />
        <v-list-item
          prepend-icon="mdi-book-open-page-variant"
          title="События"
          to="/events"
          value="events"
        />
        <v-list-item
          prepend-icon="mdi-account-hard-hat"
          title="Пользователи"
          to="/users"
          value="users"
        />
      </v-list>

      <v-divider />

      <v-list>
        <v-list-item
          v-ripple
          class="cursor-pointer"
          prepend-icon="mdi-whatsapp"
          :title="`${wTitle}`"
          :to="wStore.connected ? '' : '/whatsapp'"
        />
      </v-list>

      <v-divider />

      <v-list>
        <v-list-item
          v-ripple
          class="cursor-pointer"
          prepend-icon="mdi-logout"
          :title="aStore.user?.username"
        />
      </v-list>

      <v-divider />

      <v-list>
        <v-list-item
          v-ripple
          class="cursor-pointer"
          :title="theme.global.name.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
          @click="toggleTheme"
        >
          <template #prepend>
            <v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
          </template>
        </v-list-item>
      </v-list>

    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<script setup>
  import { useTheme } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'
  import { useWhatsappStore } from '@/stores/whatsapp'

  const wStore = useWhatsappStore()
  const aStore = useAuthStore()

  onMounted(async () => {
    await aStore.fetchUser()
    // await wStore.fetchInfo()
  })

  const wTitle = computed(() => {
    if (wStore.connected) {
      return `${wStore.info?.pushname}`
    }
    return 'Не подключён'
  })

  const theme = useTheme()
  function toggleTheme () {
    const name = theme.global.name.value
    theme.global.name.value = name === 'dark' ? 'light' : 'dark'
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('vuetify:theme', theme.global.name.value)
      }
    } catch (error) {
      console.warn('Failed saving theme to localStorage', error)
    }
  }
</script>
