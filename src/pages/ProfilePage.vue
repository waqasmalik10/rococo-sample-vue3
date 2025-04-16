<template>
  <q-page class="flex row flex-center q-pb-xl">
    <q-card class="col-11 col-sm-8 col-md-6 col-lg-4 col-xl-3 q-pa-xs q-pa-md-sm">
      <q-card-section>
        <div class="text-h6 text-center">Edit Profile</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="full-width">
          <!-- First name -->
          <q-input
            v-model="firstName"
            type="text"
            label="First Name"
            outlined
            class="q-mb-lg"
            :rules="[
              (val) => !!val || 'First name is required',
              (val) => val.length >= 2 || 'First name must be at least 2 characters',
              (val) =>
                /^[a-zA-Z\s-']+$/.test(val) ||
                'First name can only contain letters, spaces, hyphens and apostrophes',
            ]"
            :error="!!errors.firstName"
            :error-message="errors.firstName"
            @update:model-value="clearError('firstName')"
          />

          <!-- Last name -->
          <q-input
            v-model="lastName"
            type="text"
            label="Last Name"
            outlined
            class="q-mb-lg"
            :rules="[
              (val) => !!val || 'Last name is required',
              (val) => val.length >= 2 || 'Last name must be at least 2 characters',
              (val) =>
                /^[a-zA-Z\s-']+$/.test(val) ||
                'Last name can only contain letters, spaces, hyphens and apostrophes',
            ]"
            :error="!!errors.lastName"
            :error-message="errors.lastName"
            @update:model-value="clearError('lastName')"
          />

          <!-- Email display (read-only) -->
          <q-input
            v-if="authStore.user?.email"
            :model-value="authStore.user.email"
            type="text"
            label="Email Address"
            outlined
            class="q-mb-xl"
            readonly
            disable
          />

          <!-- Update Button -->
          <q-btn
            label="Update Profile"
            color="primary"
            type="submit"
            class="full-width"
            :loading="loading"
            :disable="!authStore.isAuthenticated || !isFormValid"
          />

          <div v-if="!authStore.isAuthenticated" class="text-center q-mt-md text-negative">
            You need to be logged in to update your profile
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(null)
const errors = ref({
  firstName: null,
  lastName: null,
})

// Form validation
const isFormValid = computed(() => {
  return (
    firstName.value.length >= 2 &&
    lastName.value.length >= 2 &&
    /^[a-zA-Z\s-']+$/.test(firstName.value) &&
    /^[a-zA-Z\s-']+$/.test(lastName.value)
  )
})

// Clear specific error
const clearError = (field) => {
  errors.value[field] = null
  error.value = null
}

// Load user data when component mounts and when it changes
function updateUserData() {
  if (authStore.user) {
    firstName.value = authStore.user.first_name || ''
    lastName.value = authStore.user.last_name || ''
  } else if (authStore.isAuthenticated) {
    // If we're authenticated but don't have user data, redirect to dashboard
    router.push('/dashboard')
  }
}

onMounted(() => {
  updateUserData()

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})

// Watch for changes to the user object
watch(() => authStore.user, updateUserData)

async function onSubmit() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Reset states
  error.value = null
  success.value = null
  errors.value = {
    firstName: null,
    lastName: null,
  }

  // Validate form
  if (!isFormValid.value) {
    if (firstName.value.length < 2) {
      errors.value.firstName = 'First name must be at least 2 characters'
    }
    if (lastName.value.length < 2) {
      errors.value.lastName = 'Last name must be at least 2 characters'
    }
    if (!/^[a-zA-Z\s-']+$/.test(firstName.value)) {
      errors.value.firstName =
        'First name can only contain letters, spaces, hyphens and apostrophes'
    }
    if (!/^[a-zA-Z\s-']+$/.test(lastName.value)) {
      errors.value.lastName = 'Last name can only contain letters, spaces, hyphens and apostrophes'
    }
    return
  }

  loading.value = true

  try {
    const result = await authStore.updateProfile({
      first_name: firstName.value,
      last_name: lastName.value,
    })

    if (result) {
      success.value = 'Profile updated successfully'
      // Clear success message after 3 seconds
      setTimeout(() => {
        success.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error submitting profile form:', err)
    error.value = err.response?.data?.message || 'An error occurred while updating your profile'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.q-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
