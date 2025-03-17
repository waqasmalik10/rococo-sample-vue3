<template>
  <q-page class="flex flex-center column">
    <h4>Hi, {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</h4>
    <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    />
  </q-page>
</template>

<script setup>
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()
</script>
