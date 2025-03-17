import axios from 'axios';
import { useAuthStore } from 'stores/auth'

const API_URL = process.env.VUE_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL, // Set the base URL
  headers: {
    'Content-Type': 'application/json', // Default headers
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.isAuthenticated) {
    config.headers.Authorization = `Bearer ${authStore.user.token}`;
  }
  return config;
});
  

export default apiClient;