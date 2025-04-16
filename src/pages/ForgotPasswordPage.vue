<template>
  <q-page class="flex row flex-center">
    <q-card class="col-11 col-sm-8 col-md-6 col-lg-4 col-xl-3 q-pa-xs q-pa-md-sm q-mb-xl">
      <q-card-section>
        <div class="text-h6 text-center">Reset your password</div>
        <div class="text-subtitle2 text-center">
          Enter the e-mail address used to register your account
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="full-width">
          <!-- Email -->
          <q-input v-model="email" type="email" label="Email" outlined class="q-mb-lg" />

          <!-- Reset password Button -->
          <q-btn label="Reset password" color="primary" type="submit" class="full-width" />

          <!-- Login Link -->
          <div class="text-center q-mt-md">
            <router-link to="/login">Back to login</router-link>
          </div>
          <!-- Signup Link -->
          <div class="text-center q-mt-md">
            <span>Don’t have an account? </span>
            <router-link to="/signup">Sign up</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const authStore = useAuthStore()

// Placeholder login function
async function onSubmit() {
  // Implement forgot password logic
  await authStore.forgotPassword({ email: email.value })

}
</script>
