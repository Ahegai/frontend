<template>
  <v-container fluid>
    <AppTable
      :actions="tableActions"
      :current-page="page"
      :pages="pagesCount"
      @action="onAction"
      @add="openCreate"
      @page="onPage"
    >
      <template #default>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Телефон</th>
            <th>Почта</th>
            <th>Примечание</th>
            <th>Страна</th>
            <th>События</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in sortedItems" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.phone }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.caption }}</td>
            <td>{{ c.country?.title ?? c.filter_country?.title ?? '' }}</td>
            <td>{{ (c.events || []).map(x => x.title).toString() }}</td>
            <td class="text-end">
              <v-btn
                class="rounded-lg"
                color="primary"
                icon
                size="small"
                variant="tonal"
                @click="openEdit(c)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </AppTable>

    <v-dialog v-model="createDialog" width="500">
      <v-card>
        <v-card-title>Создать клиента</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doCreate">
            <v-text-field v-model="form.name" label="Имя" required />
            <v-text-field v-model="form.email" label="Email" />
            <v-text-field v-model="form.phone" label="Телефон" required />
            <v-text-field v-model="form.caption" label="Примечание" />
            <v-select
              v-model="form.country_id"
              chips
              clearable
              item-text="title"
              item-value="id"
              :items="countriesList"
              label="Страна"
            />
            <v-select
              v-model="form.events_id"
              chips
              clearable
              item-text="name"
              item-value="id"
              :items="eventsList"
              label="События"
              multiple
            />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Создать</v-btn>
              <v-btn text @click="createDialog = false">Отмена</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" width="500">
      <v-card>
        <v-card-title>Редактировать клиента</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doUpdate">
            <v-text-field v-model="form.name" label="Имя" required />
            <v-text-field v-model="form.email" label="Email" />
            <v-text-field v-model="form.phone" label="Телефон" required />
            <v-text-field v-model="form.caption" label="Примечание" />
            <v-select
              v-model="form.country_id"
              chips
              clearable
              item-text="title"
              item-value="id"
              :items="countriesList"
              label="Страна"
            />
            <v-select
              v-model="form.events_id"
              chips
              clearable
              item-text="name"
              item-value="id"
              :items="eventsList"
              label="События"
              multiple
            />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Сохранить</v-btn>
              <v-btn color="error" :loading="loading" @click="doDelete">Удалить</v-btn>
              <v-btn text @click="editDialog = false">Отмена</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useClientsStore } from '@/stores/clients'
  import { useCountriesStore } from '@/stores/countries'
  import { useEventsStore } from '@/stores/events'

  const store = useClientsStore()
  const eventsStore = useEventsStore()
  const countriesStore = useCountriesStore()
  const createDialog = ref(false)
  const editDialog = ref(false)
  const loading = ref(false)
  const selectedId = ref(null)
  const form = reactive({ name: '', email: '', phone: '', caption: '', country_id: null, events_id: [] })

  // pagination
  const page = ref(1)
  const perPage = 10
  const total = ref(0)
  const pagesCount = ref(0)

  function openCreate () {
    form.name = ''
    form.email = ''
    form.phone = ''
    form.caption = ''
    form.events_id = []
    createDialog.value = true
  }

  function openEdit (c) {
    selectedId.value = c.id
    form.name = c.name
    form.email = c.email ?? ''
    form.phone = c.phone
    form.caption = c.caption
    // normalize events: accept either array under `events_id` or `events` and extract ids
    const raw = c.events_id ?? c.events
    form.events_id = Array.isArray(raw)
      ? raw.map(ev => (ev && ev.id) ? ev.id : ev).filter(Boolean)
      : []
    // normalize country: accept either country_id or nested country/filter_country
    form.country_id = c.country_id ?? (c.country && c.country.id) ?? (c.filter_country && c.filter_country.id) ?? null
    editDialog.value = true
  }

  async function doCreate () {
    if (!form.name || !form.phone) return
    loading.value = true
    try {
      await store.create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        caption: form.caption,
        country_id: form.country_id,
        events_id: form.events_id,
      })
      createDialog.value = false
      // refresh current page
      await loadPage()
    } catch (error_) {
      console.error('Create client failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doUpdate () {
    if (!selectedId.value) return
    loading.value = true
    try {
      await store.update(selectedId.value, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        caption: form.caption,
        country_id: form.country_id,
        events_id: form.events_id,
      })
      editDialog.value = false
      await loadPage()
    } catch (error_) {
      console.error('Update client failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doDelete () {
    if (!selectedId.value) return
    if (!confirm('Удалить клиента?')) return
    loading.value = true
    try {
      await store.remove(selectedId.value)
      editDialog.value = false
      await loadPage()
    } catch (error_) {
      console.error('Delete client failed', error_)
    } finally {
      loading.value = false
    }
  }

  function exportClients () {
    const items = (store.items || []).slice()
    if (items.length === 0) return

    const header = ['id', 'name', 'phone', 'email', 'caption', 'country', 'events']

    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`

    const rows = items.map(c => {
      const country = c.country?.title ?? c.filter_country?.title ?? ''
      const events = (c.events || []).map(e => {
        return (e && (e.title || e.name)) ? (e.title || e.name) : e
      }).filter(Boolean).join('; ')
      return [c.id, c.name, c.phone, c.email, c.caption, country, events].map(x => escape(x)).join(',')
    })

    const body = [header.map(x => escape(x)).join(',')].concat(rows).join('\n')
    const csvContent = '\uFEFF' + body
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tableActions = [
    { name: 'export_csv', label: 'Экспорт CSV', color: 'primary' },
  ]

  function onAction (name) {
    if (name === 'export_csv') exportClients()
  }

  async function loadPage (p = page.value) {
    try {
      const res = await store.fetchAll({ page: p, perPage })
      // res may be normalized object with items and total/total_pages
      total.value = res.total ?? (Array.isArray(res.items) ? res.items.length : 0)
      pagesCount.value = res.total_pages ?? Math.max(1, Math.ceil((res.total ?? total.value) / perPage))
      // keep page state in sync
      page.value = res.page ?? p
    } catch (error_) {
      console.error('Fetch clients failed', error_)
    }
  }

  function onPage (p) {
    page.value = p
    loadPage(p)
  }

  // search removed; function intentionally omitted

  const sortedItems = computed(() => (store.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))
  const eventsList = computed(() => (eventsStore.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))
  const countriesList = computed(() => (countriesStore.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))

  onMounted(async () => {
    await countriesStore.fetchAll()
    await eventsStore.fetchAll()
    await loadPage()
  })

  // reset client form when dialogs close
  watch(createDialog, v => {
    if (!v) {
      form.name = ''
      form.email = ''
      form.phone = ''
      form.caption = ''
      form.country_id = null
      form.events_id = []
    }
  })
  watch(editDialog, v => {
    if (!v) {
      selectedId.value = null
      form.name = ''
      form.email = ''
      form.phone = ''
      form.caption = ''
      form.country_id = null
      form.events_id = []
    }
  })
</script>
