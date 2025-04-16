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
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    } else {
      console.warn('Auth token is missing but isAuthenticated is true');
    }
  }
  return config;
});

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);

    // If we get a 401, clear auth and redirect to login
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      console.warn('Received 401 unauthorized, clearing authentication');
      authStore.logout();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
