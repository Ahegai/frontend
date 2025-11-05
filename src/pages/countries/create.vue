<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Создать страну</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="create">
              <v-text-field v-model="title" label="Название" required />
              <div class="d-flex ga-2">
                <v-btn color="indigo-darken-1" :loading="loading" type="submit">Создать</v-btn>
                <v-btn text @click="cancel">Отмена</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useCountriesStore } from '@/stores/countries'

  const router = useRouter()
  const countries = useCountriesStore()

  const title = ref('')
  const loading = ref(false)

  async function create () {
    if (!title.value) return
    loading.value = true
    try {
      await countries.create({ title: title.value })
      router.push('/countries')
    } catch (error_) {
      console.error('Failed to create country', error_)
    } finally {
      loading.value = false
    }
  }

  function cancel () {
    router.push('/countries')
  }
</script>
