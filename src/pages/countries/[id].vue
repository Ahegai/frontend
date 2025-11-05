<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Редактировать страну</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="Сохранить">
              <v-text-field v-model="country.title" label="Название" required />
              <div class="d-flex ga-2">
                <v-btn color="indigo-darken-1" :loading="loading" type="submit">Сохранить</v-btn>
                <v-btn color="error" :loading="loading" @click="remove">Удалить</v-btn>
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
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useCountriesStore } from '@/stores/countries'

  const route = useRoute()
  const router = useRouter()
  const countries = useCountriesStore()

  const id = Number(route.params.id)
  const country = ref({ id: null, title: '' })
  const loading = ref(false)

  async function load () {
    loading.value = true
    try {
      const data = await countries.fetchOne(id)
      country.value = data
    } catch (error_) {
      // navigate back if not found
      console.error('Failed to load country', error_)
      router.push('/countries')
    } finally {
      loading.value = false
    }
  }

  async function Сохранить () {
    loading.value = true
    try {
      await countries.update(id, { title: country.value.title })
      router.push('/countries')
    } catch (error_) {
      console.error('Failed to Сохранить country', error_)
    } finally {
      loading.value = false
    }
  }

  async function remove () {
    if (!confirm('Удалить страну?')) return
    loading.value = true
    try {
      await countries.remove(id)
      router.push('/countries')
    } catch (error_) {
      console.error('Failed to remove country', error_)
    } finally {
      loading.value = false
    }
  }

  function cancel () {
    router.push('/countries')
  }

  onMounted(load)
</script>
