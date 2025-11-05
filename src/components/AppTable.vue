<template>
  <v-card class="table">
    <v-card-title class="bg-indigo-darken-1 d-flex justify-space-between align-center">
      {{ `Список "${titleName}"` }}
      <div class="d-flex ga-2">
        <template v-for="act in actions" :key="act.name">
          <v-btn
            :color="act.color || 'primary'"
            size="small"
            @click="emit('action', act.name)"
          >
            {{ act.label }}
          </v-btn>
        </template>
        <v-btn size="small" @click="emit('add')">{{ addLabel }}</v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-table class="table-content" fixed-header>
        <slot />
      </v-table>
    </v-card-text>
    <div class="table-footer">
      <v-pagination
        v-if="pages > 0"
        v-model="localPage"
        color="indigo-darken-1"
        :length="pages"
        size="small"
        total-visible="4"
      />
    </div>
  </v-card>
</template>

<script setup>
  const props = defineProps({
    pages: {
      type: Number,
      default: 1,
    },
    // current page for controlled pagination
    currentPage: {
      type: Number,
      default: 1,
    },
    addLabel: {
      type: String,
      default: 'Добавить',
    },
    // actions: array of { name: string, label: string, color?: string, small?: boolean }
    actions: {
      type: Array,
      default: () => [],
    },
  })
  const emit = defineEmits(['add', 'action', 'page'])

  const localPage = ref(props.currentPage ?? 1)
  watch(() => props.currentPage, v => {
    if (v && v !== localPage.value) localPage.value = v
  })
  watch(localPage, v => emit('page', v))

  const route = useRoute()

  const _titles = {
    '/countries/': 'Страны',
    '/events/': 'События',
    '/users/': 'Пользователи',
    '/clients/': 'Клиенты',
    '/broadcast/': 'Рассылка',
  }

  const titleName = computed(() => _titles[route.name] ?? 'Таблица')
</script>

<style lang="scss" scoped>
  .table {
    /* Make the AppTable fill the viewport height and keep header/footer fixed
       Table body (the v-table) will scroll when content overflows */
    height: calc(100vh - 32px);
    display: flex;
    flex-direction: column;

    .v-card-text {
      /* let the card text / body grow and allow inner content to scroll */
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 0.5rem 1rem;
    }

    .table-content {
      flex: 1 1 auto;
      min-height: 0; /* allow flex child to shrink properly */
    }

    .table-footer {
      display: flex;
      justify-content: space-between;
      padding: 16px 0;
      z-index: 1;
    }
  }
</style>
