<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4">WhatsApp</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Статус</v-card-title>
          <v-card-text>
            <v-alert v-if="error" class="mb-4" type="error">
              {{ error }}
            </v-alert>

            <div class="d-flex align-center">
              <v-icon
                class="mr-2"
                :color="isReady ? 'success' : (status === 'initializing' ? 'warning' : 'error')"
              >
                {{ isReady ? 'mdi-check-circle' : (status === 'initializing' ? 'mdi-spin mdi-loading' : 'mdi-alert-circle') }}
              </v-icon>
              <span class="text-h6">
                {{ isReady ? 'Подключено' : (status === 'initializing' ? 'Инициализация...' : 'Отключено') }}
              </span>
            </div>

            <v-btn
              class="mt-4"
              color="primary"
              :disabled="isReady || status === 'initializing'"
              @click="initAuth"
            >
              {{ isReady ? 'Подключено' : (status === 'initializing' ? 'В процессе...' : 'Подключить') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card v-if="qrCode">
          <v-card-title>Отсканируйте QR-код</v-card-title>
          <v-card-text class="text-center">
            <v-img class="mx-auto" max-width="300" :src="qrCode" />
            <p class="mt-4">Откройте WhatsApp на телефоне и отсканируйте код</p>
          </v-card-text>
        </v-card>

        <v-card v-else-if="isReady">
          <v-card-title>Готово к работе</v-card-title>
          <v-card-text class="text-center">
            <v-icon color="success" size="100">mdi-whatsapp</v-icon>
            <p class="mt-4 text-h6">Клиент WhatsApp успешно подключен.</p>
          </v-card-text>
        </v-card>

        <v-card v-else-if="status === 'initializing'">
          <v-card-title>Ожидание...</v-card-title>
          <v-card-text class="text-center">
            <v-progress-circular color="primary" indeterminate size="64" />
            <p class="mt-4">Запускаем WhatsApp, ожидаем QR-код...</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  // 1. ИМПОРТИРУЕМ 'computed' И 'onMounted'
  import { computed, onMounted } from 'vue'
  import { useWhatsappStore } from '@/stores/whatsapp'

  const whatsappStore = useWhatsappStore()
  const { qrCode, status, error } = storeToRefs(whatsappStore)
  const { initAuth } = whatsappStore

  // (Старый SSE код connectSse/disconnectSse полностью удален, он не нужен)

  const isReady = computed(() => status.value === 'ready')

  // 2. ВОЗВРАЩАЕМ АВТО-ЗАПУСК
  //    Как только страница загрузится, вызываем initAuth
  onMounted(() => {
    // Проверяем, что мы еще не подключены и не в процессе
    if (status.value !== 'ready' && status.value !== 'initializing') {
      initAuth()
    }
  })
</script>
