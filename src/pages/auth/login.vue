<template>
  <v-container class="d-flex justify-center align-center" height="100%">
    <v-row>
      <v-col cols="4" />
      <v-col cols="4">
        <v-card centered width="100%">
          <v-card-title class="text-h5 mb-2">Вход в систему</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="signIn">
              <v-alert v-if="error" class="mb-4" dense type="error">
                {{ error }}
              </v-alert>

              <v-text-field v-model="data.name" label="Имя" required type="text" />
              <v-text-field v-model="data.password" label="Пароль" required type="password" />
              <v-btn
                block
                class="mt-4"
                color="green-lighten-1"
                :disabled="loading"
                :loading="loading"
                size="large"
                type="submit"
              >Войти</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4" />
    </v-row>
  </v-container>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const auth = useAuthStore()

  const data = ref({
    name: '',
    password: '',
  })

  const loading = ref(false)
  const error = ref(null)

  async function signIn (evt) {
    if (evt && typeof evt.preventDefault === 'function') evt.preventDefault()

    error.value = null

    if (!data.value.name || !data.value.password) {
      error.value = 'Пожалуйста, введите имя и пароль.'
      return
    }

    loading.value = true
    try {
      await auth.login({ name: data.value.name, password: data.value.password })
      // navigate to home path — named route 'index' may not exist in auto-generated routes
      router.push('/')
    } catch (error_) {
      error.value = error_?.response?.data?.message || error_?.message || 'Ошибка входа'
      console.error('Login failed', error_)
    } finally {
      loading.value = false
    }
  }
</script>
