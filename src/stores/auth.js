import { defineStore, acceptHMRUpdate } from 'pinia'
import { Notify } from 'quasar';
import axios from "config/axios"
import localStorageService from 'services/localStorage.service';

import { handleAuthRequest } from '@/utils/apiHelper';


export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: localStorageService.getItem('user') || null, // Initialize from localStorage
    accessToken: localStorageService.getItem('accessToken') || null, // Initialize from localStorage
    accessTokenExpiry: localStorageService.getItem('accessTokenExpiry') || null, // Initialize from localStorage
  }),

  getters: {
    // Computed property for isAuthenticated
    isAuthenticated: (state) => {
      if (!state.accessToken || !state.accessTokenExpiry) {
        return false; // No token or expiry date
      }

      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds (UNIX timestamp)
      return currentTime < state.accessTokenExpiry; // Check if token is still valid
    },
  },

  actions: {
    async signup(payload) {
      let response
      try {
        response = await axios.post('/auth/signup', payload);        
      } catch {
        Notify.create({
          message: "An unknown error occurred",
          color: "danger"
        })
        return false;
      }

      if (response.data?.success) {
        return true;
      } else {
        Notify.create({
          message: response.data?.message,
          color: "danger"
        })
      }
    },

    async login(payload) {
      return handleAuthRequest(this, () =>
        axios.post('/auth/login', payload), this.router
      );
    },

    async setPassword(token, uidb64, payload) {
      return handleAuthRequest(this, () =>
        axios.post(`/auth/reset_password/${token}/${uidb64}`, payload), this.router
      );
    },

    async logout() {
      localStorageService.clear()
      this.user = null;
      this.accessToken = null;
      this.accessTokenExpiry = null;
      this.router.push('/login')
    },
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
