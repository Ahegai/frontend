<template>
  <v-container fluid>
    <AppTable :add-label="'Отправить рассылку'" :pages="0" @add="openSend">
      <thead>
        <tr>
          <th>ID</th>
          <th>Сообщение</th>
          <th>Получателей</th>
          <th>Отправлено</th>
          <th>Отправил</th>
          <th>Страна</th>
          <th>Событие</th>
          <th /></tr>
      </thead>
      <tbody>
        <tr v-for="b in sortedItems" :key="b.id">
          <td>{{ b.id }}</td>
          <td>{{ b.message }}</td>
          <td>{{ b.total_recipients }}</td>
          <td>{{ b.sent_at ? new Date(b.sent_at).toLocaleString() : '' }}</td>
          <td>{{ b.sent_by_user?.username }}</td>
          <td>{{ b.filter_country?.title }}</td>
          <td>{{ b.filter_event?.title }}</td>
          <td class="text-end">
            <v-btn
              class="rounded-lg"
              color="primary"
              icon
              size="small"
              variant="tonal"
              @click="openDetails(b)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </AppTable>

    <v-dialog v-model="sendDialog" width="600">
      <v-card>
        <v-card-title>Отправить рассылку</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doSend">
            <v-textarea v-model="form.message" label="Сообщение" required rows="4" />

            <v-select
              v-model="form.filter_country_id"
              clearable
              item-text="title"
              item-value="id"
              :items="countriesList"
              label="Страна (необязательно)"
            />

            <v-select
              v-model="form.filter_event_id"
              clearable
              item-text="title"
              item-value="id"
              :items="eventsList"
              label="Событие (необязательно)"
            />

            <v-tabs v-model="mediaTab" background-color="transparent" class="mt-4">
              <v-tab value="file">Файл</v-tab>
              <v-tab value="url">URL</v-tab>
            </v-tabs>
            <v-tabs-window v-model="mediaTab">
              <v-tabs-window-item value="file">
                <v-file-input
                  v-model="form.file"
                  accept="image/*"
                  class="mt-4"
                  clearable
                  label="Прикрепить изображение"
                  placeholder="Выберите файл"
                  @click:clear="form.file = null"
                />
              </v-tabs-window-item>

              <v-tabs-window-item value="url">
                <v-text-field
                  v-model="form.image_url"
                  class="mt-4"
                  clearable
                  label="URL изображения"
                  placeholder="https://..."
                  @input="onImageUrlInput"
                />
              </v-tabs-window-item>
            </v-tabs-window>

            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="broadcast.sending" type="submit">Отправить</v-btn>
              <v-btn text @click="sendDialog = false">Отмена</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailsDialog" width="700">
      <v-card>
        <v-card-title>Детали рассылки</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <strong>Сообщение</strong>
              <div class="mt-2">{{ selectedBroadcast?.message ?? '-' }}</div>
            </v-col>

            <v-col cols="6">
              <strong>Получателей</strong>
              <div class="mt-1">{{ selectedBroadcast?.total_recipients ?? '-' }}</div>
            </v-col>

            <v-col cols="6">
              <strong>Отправлено</strong>
              <div class="mt-1">{{ selectedBroadcast ? new Date(selectedBroadcast.sent_at).toLocaleString() : '-' }}</div>
            </v-col>

            <v-col cols="6">
              <strong>Отправил</strong>
              <div class="mt-1">{{ selectedBroadcast?.sent_by_user?.username ?? selectedBroadcast?.sent_by_user?.id ?? '-' }}</div>
            </v-col>

            <v-col cols="6">
              <strong>Страна</strong>
              <div class="mt-1">{{ selectedBroadcast?.filter_country?.title ?? '-' }}</div>
            </v-col>

            <v-col cols="6">
              <strong>Событие</strong>
              <div class="mt-1">{{ selectedBroadcast?.filter_event?.title ?? '-' }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>Дополнительно (JSON)</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre>{{ selectedBroadcast }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="detailsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useBroadcastStore } from '@/stores/broadcast'
  import { useCountriesStore } from '@/stores/countries'
  import { useEventsStore } from '@/stores/events'
  import { useWhatsappStore } from '@/stores/whatsapp'

  const broadcast = useBroadcastStore()
  const countries = useCountriesStore()
  const events = useEventsStore()
  const whatsapp = useWhatsappStore()
  const router = useRouter()

  const sendDialog = ref(false)
  const detailsDialog = ref(false)
  const selectedBroadcast = ref(null)

  const form = reactive({ message: '', filter_country_id: null, filter_event_id: null })

  // allow attaching either a file or an image URL (only one)
  form.file = null
  form.image_url = ''

  const mediaTab = ref('file')

  // when switching tabs ensure only the active input remains
  watch(mediaTab, v => {
    if (v === 'file') form.image_url = ''
    if (v === 'url') form.file = null
  })

  function onImageUrlInput (v) {
    // if user types an URL, clear file selection
    if (v) form.file = null
  }

  function fileToBase64 (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const result = reader.result
        if (typeof result !== 'string') return reject(new Error('Unexpected file read result'))
        // result is like 'data:<mime>;base64,<base64data>'
        const idx = result.indexOf(',')
        if (idx === -1) resolve(result)
        else resolve(result.slice(idx + 1))
      })
      reader.addEventListener('error', err => reject(err))
      reader.readAsDataURL(file)
    })
  }

  function openSend () {
    form.message = ''
    form.filter_country_id = null
    form.filter_event_id = null
    mediaTab.value = 'file'
    sendDialog.value = true
  }

  function openDetails (b) {
    selectedBroadcast.value = b
    detailsDialog.value = true
  }

  async function doSend () {
    if (!form.message) return
    try {
      // If a file is attached, convert it to base64 and send as JSON media object
      if (form.file) {
        // v-file-input may return an array or a single File
        const file = Array.isArray(form.file) ? form.file[0] : form.file
        const base64 = await fileToBase64(file)
        const payload = {
          message: form.message,
          filter_country_id: form.filter_country_id,
          filter_event_id: form.filter_event_id,
          media: {
            buffer: base64,
            mime: file.type || 'application/octet-stream',
            filename: file.name || 'file',
          },
        }
        await broadcast.send(payload)
      } else if (form.image_url) {
        // send JSON with media.url
        await broadcast.send({ message: form.message, filter_country_id: form.filter_country_id, filter_event_id: form.filter_event_id, media: { url: form.image_url } })
      } else {
        // text-only
        await broadcast.send({ message: form.message, filter_country_id: form.filter_country_id, filter_event_id: form.filter_event_id })
      }

      sendDialog.value = false
      await broadcast.fetchAll()
    } catch (error) {
      console.error('Send failed', error)
    }
  }

  const sortedItems = computed(() => (broadcast.items || []).toSorted((a, b) => (b.id || 0) - (a.id || 0)))
  const countriesList = computed(() => (countries.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))
  const eventsList = computed(() => (events.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))

  onMounted(async () => {
    await countries.fetchAll()
    await events.fetchAll()
    // ensure whatsapp is connected before accessing broadcast page
    try {
      const info = await whatsapp.fetchInfo()
      if (!info.pushname) {
        router.push('/whatsapp')
        return
      }
    } catch (error) {
      // if fetch failed, redirect to whatsapp page to let user re-connect
      console.warn('Failed to fetch whatsapp info:', error)
      router.push('/whatsapp')
      return
    }

    await broadcast.fetchAll()
  })

  // reset send form when dialog closes
  watch(sendDialog, v => {
    if (!v) {
      form.message = ''
      form.filter_country_id = null
      form.filter_event_id = null
      form.file = null
      form.image_url = ''
    }
  })
</script>

<style scoped>
pre { white-space: pre-wrap }
</style>
