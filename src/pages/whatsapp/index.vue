<template>
  <v-container>
    <v-card v-if="step === 1" class="mt-12">
      <v-card-title class="bg-indigo-darken-1">Авторизация в WhatsApp</v-card-title>
      <v-card-text class="d-flex ga-4 align-center justify-space-between">
        <v-list class="bg-transparent" density="comfortable">
          <v-list-item v-for="(step, index) in steps" :key="index" class="px-0">
            <template #prepend>
              <div
                class="d-flex align-center justify-center rounded-circle border border-grey-darken-1"
                style="width: 28px; height: 28px;"
              >
                <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
              </div>
            </template>
            <v-list-item-title class="text-body-1 ml-3">{{ step }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <div class="text-center my-6">
          <v-img
            v-if="qr"
            alt="QR code"
            class="mx-auto rounded-lg border border-grey-lighten-2"
            :src="qr"
            width="190px"
          />
          <v-progress-circular
            v-else
            class="mr-10"
            color="green-lighten-1"
            indeterminate
            size="64"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
  import { useWhatsappStore } from '@/stores/whatsapp'

  const store = useWhatsappStore()
  const step = ref(1)
  const qr = ref(null)
  const router = useRouter()

  const steps = [
    'Откройте WhatsApp на своём телефоне',
    'На Android нажмите Меню ⋮, на iPhone — Настройки ⚙️',
    'Нажмите Связанные устройства, затем Связывание устройства',
    'Отсканируйте QR-код для подтверждения',
  ]

  async function startAuth () {
    await fetch('http://localhost:3001/api/whatsapp/auth')
    const source = new EventSource('http://localhost:3001/api/whatsapp/qr')

    source.addEventListener('message', event => {
      const data = JSON.parse(event.data)
      qr.value = data.type === 'ready' ? null : data
      if (data.type === 'ready') {
        step.value = 2
        router.push('/broadcast')
      } else {
        qr.value = data.data
      }
    })
  }

  onMounted(async () => {
    if (store.connected) {
      step.value = 2
      router.push('/broadcast')
    } else {
      step.value = 1
      await startAuth()
    }
  })
</script>
