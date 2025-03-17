import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })


  // Add a global navigation guard
  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore(); // Initialize the auth store

    // Check if the route requires authentication
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      console.log("Nav guard in action... Redirected to login...")
      next({ path: '/login' });
    }
    // Check if the route requires the user to be non-authenticated
    else if (to.meta.requiresAuth === false && authStore.isAuthenticated) {
      // Redirect to dashboard if authenticated
      console.log("Nav guard in action... Redirected to dashboard...")
      next({ path: '/dashboard' });
    } else {
      // Allow navigation
      next();
    }
  });

  return Router
})
