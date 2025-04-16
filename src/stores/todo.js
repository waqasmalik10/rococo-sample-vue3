import { defineStore, acceptHMRUpdate } from 'pinia'
import { Notify } from 'quasar'
import axios from 'config/axios'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [],
    activeFilter: 'all', // 'all', 'active', 'completed'
    pagination: {
      page: 1,
      per_page: 10,
      total_todos: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    },
    loading: false,
    error: null,
  }),

  getters: {
    filteredTodos: (state) => {
      if (state.activeFilter === 'active') {
        return state.todos.filter((todo) => !todo.is_completed)
      } else if (state.activeFilter === 'completed') {
        return state.todos.filter((todo) => todo.is_completed)
      }
      return state.todos
    },

    completedCount: (state) => {
      // Use total_completed_todos from pagination if available, otherwise count locally
      return state.pagination.total_completed_todos !== undefined
        ? state.pagination.total_completed_todos
        : state.todos.filter((todo) => todo.is_completed).length
    },

    activeCount: (state) => {
      // Use total_incomplete_todos from pagination if available, otherwise count locally
      return state.pagination.total_incomplete_todos !== undefined
        ? state.pagination.total_incomplete_todos
        : state.todos.filter((todo) => !todo.is_completed).length
    },

    allCount: (state) => {
      // Use total_todos from pagination if available, otherwise count from local todos
      return state.pagination.total_all_todos !== undefined
        ? state.pagination.total_all_todos
        : state.todos.length
    },

    currentPage: (state) => state.pagination.page,

    totalPages: (state) => {
      return state.pagination.total_pages
    },

    hasNextPage: (state) => state.pagination.has_next,

    hasPrevPage: (state) => state.pagination.has_prev,

    isLoading: (state) => state.loading,

    hasError: (state) => !!state.error,
  },

  actions: {
    setError(error) {
      this.error = error
      // Clear error after 5 seconds
      setTimeout(() => {
        this.error = null
      }, 5000)
    },

    async fetchTodos(status = '', page = 1, per_page = 10) {
      this.loading = true
      this.error = null

      try {
        // Convert the filter status to the API expected format
        let apiStatus
        if (status === 'active') {
          apiStatus = 'incomplete'
        } else if (status === 'completed') {
          apiStatus = 'completed'
        } else {
          apiStatus = '' // 'all' case
        }

        const response = await axios.get('/todo/', {
          params: {
            status: apiStatus || undefined,
            page,
            per_page,
          },
        })

        if (response.data?.success) {
          this.todos = response.data.todos || []
          if (response.data.pagination) {
            this.pagination = response.data.pagination
          }
        } else {
          throw new Error('Failed to fetch todos')
        }
      } catch (error) {
        console.error('Error fetching todos:', error)
        this.setError(error.response?.data?.message || 'Failed to fetch todos')
        Notify.create({
          message: 'Failed to fetch todos',
          color: 'negative',
        })
      } finally {
        this.loading = false
      }
    },

    async addTodo(title, description = null) {
      this.loading = true
      this.error = null

      let optimisticTodo = null
      try {
        // Optimistic update
        optimisticTodo = {
          entity_id: Date.now(), // Temporary ID
          title,
          description,
          is_completed: false,
          created_at: new Date().toISOString(),
        }
        this.todos.unshift(optimisticTodo)

        const response = await axios.post('/todo/', {
          title,
          description,
        })

        if (response.data?.success) {
          // Replace optimistic todo with real one
          const index = this.todos.findIndex((t) => t.entity_id === optimisticTodo.entity_id)
          if (index !== -1) {
            this.todos[index] = response.data.todo
          }

          // Refetch to ensure correct state
          await this.fetchTodos(this.activeFilter, 1, this.pagination.per_page)

          Notify.create({
            message: 'Todo added successfully',
            color: 'positive',
          })
          return true
        }
      } catch (error) {
        console.error('Error adding todo:', error)
        // Remove optimistic todo on error
        if (optimisticTodo) {
          this.todos = this.todos.filter((t) => t.entity_id !== optimisticTodo.entity_id)
        }
        this.setError(error.response?.data?.message || 'Failed to add todo')
        Notify.create({
          message: 'Failed to add todo',
          color: 'negative',
        })
      } finally {
        this.loading = false
      }
      return false
    },

    async updateTodo(todoId, updates) {
      this.loading = true
      this.error = null

      let todoIndex = -1
      let originalTodo = null

      try {
        // Find the todo to update
        todoIndex = this.todos.findIndex((t) => t.entity_id === todoId)
        if (todoIndex === -1) throw new Error('Todo not found')

        // Store original state for rollback
        originalTodo = { ...this.todos[todoIndex] }

        // Optimistic update
        this.todos[todoIndex] = { ...this.todos[todoIndex], ...updates }

        const response = await axios.put(`/todo/${todoId}`, updates)

        if (response.data?.success) {
          this.todos[todoIndex] = response.data.todo

          if (updates.is_completed === undefined) {
            Notify.create({
              message: 'Todo updated successfully',
              color: 'positive',
            })
          } else {
            await this.fetchTodos(this.activeFilter, 1, this.pagination.per_page)
          }

          return true
        }
      } catch (error) {
        console.error('Error updating todo:', error)
        // Rollback on error
        if (todoIndex !== -1 && originalTodo) {
          this.todos[todoIndex] = originalTodo
        }
        this.setError(error.response?.data?.message || 'Failed to update todo')
        Notify.create({
          message: 'Failed to update todo',
          color: 'negative',
        })
      } finally {
        this.loading = false
      }
      return false
    },

    async deleteTodo(todoId) {
      this.loading = true
      this.error = null

      let todoIndex = -1
      let deletedTodo = null

      try {
        // Store todo for potential rollback
        todoIndex = this.todos.findIndex((t) => t.entity_id === todoId)
        if (todoIndex === -1) throw new Error('Todo not found')
        deletedTodo = this.todos[todoIndex]

        // Optimistic delete
        this.todos = this.todos.filter((t) => t.entity_id !== todoId)

        const response = await axios.delete(`/todo/${todoId}`)

        if (response.data?.success) {
          // After deleting, we should refetch the current page
          // If we're on the last page and it's now empty, go to previous page
          const currentPage = this.pagination.page
          const shouldGoToPrevPage = this.todos.length === 0 && currentPage > 1

          await this.fetchTodos(
            this.activeFilter,
            shouldGoToPrevPage ? currentPage - 1 : currentPage,
            this.pagination.per_page,
          )

          Notify.create({
            message: 'Todo deleted successfully',
            color: 'positive',
          })
          return true
        }
      } catch (error) {
        console.error('Error deleting todo:', error)
        // Rollback on error
        if (todoIndex !== -1 && deletedTodo) {
          this.todos.splice(todoIndex, 0, deletedTodo)
        }
        this.setError(error.response?.data?.message || 'Failed to delete todo')
        Notify.create({
          message: 'Failed to delete todo',
          color: 'negative',
        })
      } finally {
        this.loading = false
      }
      return false
    },

    setFilter(filter, per_page = null) {
      this.activeFilter = filter
      this.pagination.page = 1 // Reset to first page when changing filters
      this.error = null

      // Use the provided per_page or fallback to the current per_page value
      const itemsPerPage = per_page || this.pagination.per_page

      // Update per_page in pagination state to maintain consistency
      this.pagination.per_page = itemsPerPage

      this.fetchTodos(filter, 1, itemsPerPage)
    },

    goToPage(page, per_page) {
      if (page >= 1 && page <= this.pagination.total_pages) {
        this.pagination.page = page
        this.error = null
        this.fetchTodos(this.activeFilter, page, per_page)
      }
    },

    nextPage() {
      if (this.pagination.has_next) {
        const nextPage = this.pagination.page + 1
        this.goToPage(nextPage, this.pagination.per_page)
      }
    },

    prevPage() {
      if (this.pagination.has_prev) {
        const prevPage = this.pagination.page - 1
        this.goToPage(prevPage, this.pagination.per_page)
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTodoStore, import.meta.hot))
}
