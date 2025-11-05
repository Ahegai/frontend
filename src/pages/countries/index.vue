<template>
  <v-container fluid>
    <AppTable
      :pages="0"
      @add="openCreate"
    >
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="country in sortedItems" :key="country.id">
          <td>{{ country.id }}</td>
          <td>{{ country.title }}</td>
          <td class="text-end">
            <v-btn
              class="rounded-lg"
              color="primary"
              icon
              size="small"
              variant="tonal"
              @click="openEdit(country)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </AppTable>

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" width="500">
      <v-card>
        <v-card-title>Создать страну</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doCreate">
            <v-text-field v-model="form.title" label="Название" required />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Создать</v-btn>
              <v-btn text @click="createDialog = false">Отмена</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" width="500">
      <v-card>
        <v-card-title>Редактировать страну</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doUpdate">
            <v-text-field v-model="form.title" label="Название" required />
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
  import { useCountriesStore } from '@/stores/countries'

  const store = useCountriesStore()

  const createDialog = ref(false)
  const editDialog = ref(false)
  const loading = ref(false)
  const selectedId = ref(null)
  const form = reactive({ title: '' })

  function openCreate () {
    form.title = ''
    createDialog.value = true
  }

  function openEdit (country) {
    selectedId.value = country.id
    form.title = country.title
    editDialog.value = true
  }

  async function doCreate () {
    if (!form.title) return
    loading.value = true
    try {
      await store.create({ title: form.title })
      createDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Create failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doUpdate () {
    if (!form.title || !selectedId.value) return
    loading.value = true
    try {
      await store.update(selectedId.value, { title: form.title })
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Update failed', error_)
    } finally {
      loading.value = false
    }
  }

  async function doDelete () {
    if (!selectedId.value) return
    if (!confirm('Удалить страну?')) return
    loading.value = true
    try {
      await store.remove(selectedId.value)
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error('Delete failed', error_)
    } finally {
      loading.value = false
    }
  }

  const sortedItems = computed(() => {
    return (store.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0))
  })

  onMounted(async () => {
    await store.fetchAll()
  })

  // reset form when dialogs close
  watch(createDialog, v => {
    if (!v) form.title = ''
  })
  watch(editDialog, v => {
    if (!v) {
      selectedId.value = null
      form.title = ''
    }
  })
</script>
