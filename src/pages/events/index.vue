<template>
  <v-container fluid>
    <AppTable :pages="0" @add="openCreate">
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in sortedItems" :key="e.id">
          <td>{{ e.id }}</td>
          <td>{{ e.title }}</td>
          <td class="text-end">
            <v-btn
              class="rounded-lg"
              color="primary"
              icon
              size="small"
              variant="tonal"
              @click="openEdit(e)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </AppTable>

    <v-dialog v-model="createDialog" width="600">
      <v-card>
        <v-card-title>Создать событие</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doCreate">
            <v-text-field v-model="form.title" label="Название" required />
            <v-textarea v-model="form.description" label="Описание" />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Создать</v-btn>
              <v-btn text @click="createDialog = false">Отменить</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" width="600">
      <v-card>
        <v-card-title>Изменить событие</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doUpdate">
            <v-text-field v-model="form.title" label="Название" required />
            <v-textarea v-model="form.description" label="Описание" />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Сохранить</v-btn>
              <v-btn color="error" :loading="loading" @click="doDelete">Удалить</v-btn>
              <v-btn text @click="editDialog = false">Отменить</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useEventsStore } from '@/stores/events'

  const store = useEventsStore()
  const createDialog = ref(false)
  const editDialog = ref(false)
  const loading = ref(false)
  const selectedId = ref(null)
  const form = reactive({ title: '', description: '' })

  function openCreate () {
    form.title = ''
    form.description = ''
    createDialog.value = true
  }

  function openEdit (e) {
    selectedId.value = e.id
    form.title = e.title
    form.description = e.description ?? ''
    editDialog.value = true
  }

  async function doCreate () {
    if (!form.title || !form.startDate) return
    loading.value = true
    try {
      await store.create({ title: form.title, description: form.description })
      createDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Create event failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doUpdate () {
    if (!selectedId.value) return
    loading.value = true
    try {
      await store.update(selectedId.value, { title: form.title, description: form.description })
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Update event failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doDelete () {
    if (!selectedId.value) return
    if (!confirm('Удалить событие?')) return
    loading.value = true
    try {
      await store.remove(selectedId.value)
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Delete event failed', error_)
    } finally {
      loading.value = false
    }
  }

  const sortedItems = computed(() => (store.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))

  onMounted(async () => {
    await store.fetchAll()
  })

  watch(createDialog, v => {
    if (!v) {
      form.title = ''
      form.description = ''
    }
  })
  watch(editDialog, v => {
    if (!v) {
      selectedId.value = null
      form.title = ''
      form.description = ''
    }
  })
</script>
