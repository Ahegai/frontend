<template>
  <v-container fluid>
    <AppTable :pages="0" @add="openCreate">
      <thead>
        <tr>
          <th>ID</th>
          <th>Имя пользователя</th>
          <th /></tr>
      </thead>
      <tbody>
        <tr v-for="user in sortedItems" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.username }}</td>
          <td class="text-end">
            <v-btn
              class="rounded-lg"
              color="primary"
              icon
              size="small"
              variant="tonal"
              @click="openEdit(user)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </AppTable>

    <v-dialog v-model="createDialog" width="500">
      <v-card>
        <v-card-title>Создать пользователя</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doCreate">
            <v-text-field v-model="form.username" label="Имя пользователя" required />
            <v-text-field v-model="form.password" label="Пароль" required type="password" />
            <div class="d-flex ga-2 mt-4">
              <v-btn color="indigo-darken-1" :loading="loading" type="submit">Создать</v-btn>
              <v-btn text @click="createDialog = false">Отменить</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" width="500">
      <v-card>
        <v-card-title>Изменить пользователя</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="doUpdate">
            <v-text-field v-model="form.username" label="Имя пользователя" required />
            <v-text-field v-model="form.password" label="Пароль" type="password" />
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
  import { useUsersStore } from '@/stores/users'

  const store = useUsersStore()
  const createDialog = ref(false)
  const editDialog = ref(false)
  const loading = ref(false)
  const selectedId = ref(null)
  const form = reactive({ username: '', password: '' })

  function openCreate () {
    form.username = ''
    form.password = ''
    createDialog.value = true
  }

  function openEdit (user) {
    selectedId.value = user.id
    form.username = user.username
    form.password = ''
    editDialog.value = true
  }

  async function doCreate () {
    if (!form.username || !form.password) return
    loading.value = true
    try {
      await store.create({ username: form.username, password: form.password })
      createDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error(error_)
    } finally {
      loading.value = false
    }
  }

  async function doUpdate () {
    if (!selectedId.value) return
    loading.value = true
    try {
      await store.update(selectedId.value, { username: form.username, ...(form.password ? { password: form.password } : {}) })
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error(error_)
    } finally {
      loading.value = false
    }
  }

  async function doDelete () {
    if (!selectedId.value) return
    if (!confirm('Delete user?')) return
    loading.value = true
    try {
      await store.remove(selectedId.value)
      editDialog.value = false
      await store.fetchAll()
    } catch (error_) {
      console.error(error_)
    } finally {
      loading.value = false
    }
  }

  const sortedItems = computed(() => (store.items || []).toSorted((a, b) => (a.id || 0) - (b.id || 0)))

  onMounted(async () => {
    await store.fetchAll()
  })

  // reset forms when dialogs close
  watch(createDialog, v => {
    if (!v) {
      form.username = ''
      form.password = ''
    }
  })
  watch(editDialog, v => {
    if (!v) {
      selectedId.value = null
      form.username = ''
      form.password = ''
    }
  })
</script>
