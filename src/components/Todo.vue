<template>
  <div class="todo-container q-pa-md">
    <h1 class="text-h4 text-center q-mb-lg text-primary">TodoMVC</h1>

    <!-- Filter Cards -->
    <div class="row justify-center q-mb-lg">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="row q-col-gutter-md">
          <div class="col-4">
            <q-card
              :class="{ 'filter-active': activeTab === 'all' }"
              class="filter-card text-center cursor-pointer"
              @click="setFilter('all')"
            >
              <q-card-section>
                <div class="text-h6">All</div>
                <div class="text-h5">{{ todoStore.allCount }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-4">
            <q-card
              :class="{ 'filter-active': activeTab === 'active' }"
              class="filter-card text-center cursor-pointer"
              @click="setFilter('active')"
            >
              <q-card-section>
                <div class="text-h6">Active</div>
                <div class="text-h5">{{ todoStore.activeCount }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-4">
            <q-card
              :class="{ 'filter-active': activeTab === 'completed' }"
              class="filter-card text-center cursor-pointer"
              @click="setFilter('completed')"
            >
              <q-card-section>
                <div class="text-h6">Completed</div>
                <div class="text-h5">{{ todoStore.completedCount }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Todo List -->
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="todo-list-card">
          <q-card-section v-if="todoStore.filteredTodos.length === 0">
            <div class="text-center text-grey q-pa-md">
              <q-icon name="task_alt" size="50px" color="grey-4" />
              <p>No tasks found</p>
            </div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="todo in todoStore.filteredTodos" :key="todo.entity_id" class="q-py-md">
              <q-item-section avatar>
                <q-checkbox
                  v-model="todo.is_completed"
                  @update:model-value="updateTodoStatus(todo)"
                >
                  <q-tooltip>
                    {{ todo.is_completed ? 'Completed' : 'Not Completed' }}
                  </q-tooltip>
                </q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label :class="{ 'text-strike text-grey': todo.is_completed }">
                  {{ todo.title }}
                </q-item-label>
                <q-item-label caption v-if="todo.description">
                  {{ todo.description }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center">
                  <q-btn icon="edit" flat round dense @click="openEditDialog(todo)">
                    <q-tooltip>Edit Task</q-tooltip>
                  </q-btn>
                  <q-btn icon="delete" flat round dense @click="deleteTodo(todo)" color="negative">
                    <q-tooltip>Delete Task</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Pagination -->
          <q-card-section v-if="paginationVisible" class="q-pt-none">
            <div class="row justify-between items-center">
              <div class="col-auto">
                <span class="text-caption text-grey-8">
                  Showing {{ todoStore.filteredTodos.length }} of
                  {{ getFilteredTotalCount() }} items
                </span>
              </div>
              <div class="col-auto">
                <div class="row items-center q-gutter-sm">
                  <q-select
                    v-model="perPage"
                    :options="perPageOptions"
                    dense
                    outlined
                    label="Per page"
                    style="width: 100px"
                    @update:model-value="changePerPage"
                  />
                  <q-pagination
                    v-if="todoStore.totalPages > 1"
                    v-model="currentPage"
                    :max="todoStore.totalPages"
                    :max-pages="5"
                    boundary-numbers
                    direction-links
                    @update:model-value="changePage"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openNewTodoDialog">
        <q-tooltip>Add New Task</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- New Todo Dialog -->
    <q-dialog v-model="newTodoDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">New Task</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="addNewTodo">
            <q-input
              v-model="newTodo.title"
              outlined
              label="Task Title"
              :rules="[(val) => !!val || 'Title is required']"
              ref="todoInput"
              class="q-mb-md"
            />

            <q-input
              v-model="newTodo.description"
              outlined
              type="textarea"
              label="Description"
              rows="3"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" v-close-popup />
              <q-btn label="Add Task" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit Todo Dialog -->
    <q-dialog v-model="editTodoDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Edit Task</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="cancelEditing" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="finishEditing">
            <q-input
              v-model="editingTodo.title"
              outlined
              label="Task Title"
              :rules="[(val) => !!val || 'Title is required']"
              ref="editTodoInput"
              class="q-mb-md"
            />

            <q-input
              v-model="editingTodo.description"
              outlined
              type="textarea"
              label="Description"
              rows="3"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" v-close-popup @click="cancelEditing" />
              <q-btn label="Save Changes" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { useTodoStore } from 'src/stores/todo'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'TodoComponent',

  setup() {
    const $q = useQuasar()
    const todoStore = useTodoStore()
    const todoInput = ref(null)
    const editTodoInput = ref(null)
    const activeTab = ref('all')
    const newTodoDialog = ref(false)
    const editTodoDialog = ref(false)
    const currentPage = ref(1)
    const perPage = ref(10)
    const perPageOptions = [5, 10, 25, 50]

    const newTodo = ref({
      title: '',
      description: '',
    })

    const editingTodo = ref({
      entity_id: null,
      title: '',
      description: '',
      is_completed: false,
      originalTitle: '',
      originalDescription: '',
    })

    onMounted(() => {
      todoStore.fetchTodos('', 1, perPage.value)
    })

    // Watch for changes in the store's current page
    watch(
      () => todoStore.currentPage,
      (newPage) => {
        currentPage.value = newPage
      },
    )

    // Watch for changes in the per_page from the store
    watch(
      () => todoStore.pagination.per_page,
      (newPerPage) => {
        if (newPerPage !== perPage.value) {
          perPage.value = newPerPage
        }
      },
    )

    // Watch for changes in the pagination object
    const pageMeta = computed(() => todoStore.pagination)

    // Watch for filter changes
    watch(
      () => todoStore.activeFilter,
      (newFilter) => {
        activeTab.value = newFilter
      },
    )

    const openNewTodoDialog = () => {
      newTodo.value = { title: '', description: '' }
      newTodoDialog.value = true
      // Focus the title input after the dialog is fully rendered
      setTimeout(() => {
        if (todoInput.value) {
          todoInput.value.focus()
        }
      }, 100)
    }

    const openEditDialog = (todo) => {
      editingTodo.value = {
        entity_id: todo.entity_id,
        title: todo.title,
        description: todo.description || '',
        is_completed: todo.is_completed,
        originalTitle: todo.title,
        originalDescription: todo.description || '',
      }
      editTodoDialog.value = true
      // Focus the edit title input after the dialog is fully rendered
      setTimeout(() => {
        if (editTodoInput.value) {
          editTodoInput.value.focus()
        }
      }, 100)
    }

    const addNewTodo = async () => {
      if (!newTodo.value.title) return

      const success = await todoStore.addTodo(newTodo.value.title, newTodo.value.description)
      if (success) {
        newTodo.value.title = ''
        newTodo.value.description = ''
        newTodoDialog.value = false
      }
    }

    const updateTodoStatus = async (todo) => {
      const previousState = !todo.is_completed
      const result = await todoStore.updateTodo(todo.entity_id, { is_completed: todo.is_completed })

      if (result) {
        // Show notification about status change
        $q.notify({
          type: todo.is_completed ? 'positive' : 'info',
          message: todo.is_completed
            ? `Task "${todo.title}" marked as completed`
            : `Task "${todo.title}" marked as active`,
          position: 'top',
          timeout: 2000,
        })
      } else {
        // If update failed, revert the checkbox state
        todo.is_completed = previousState
      }
    }

    const finishEditing = async () => {
      if (!editingTodo.value.title.trim()) {
        return
      }

      await todoStore.updateTodo(editingTodo.value.entity_id, {
        title: editingTodo.value.title,
        description: editingTodo.value.description,
      })

      editTodoDialog.value = false
    }

    const cancelEditing = () => {
      editTodoDialog.value = false
    }

    const deleteTodo = async (todo) => {
      $q.dialog({
        title: 'Confirm',
        message: 'Are you sure you want to delete this task?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        await todoStore.deleteTodo(todo.entity_id)
      })
    }

    const setFilter = (filter) => {
      activeTab.value = filter
      currentPage.value = 1
      todoStore.setFilter(filter, perPage.value)
    }

    const changePage = (page) => {
      todoStore.goToPage(page, perPage.value)
    }

    const changePerPage = (value) => {
      todoStore.goToPage(1, value)
      currentPage.value = 1
    }

    const paginationVisible = computed(() => todoStore.totalPages > 0)

    const getFilteredTotalCount = () => {
      switch (activeTab.value) {
        case 'active':
          return todoStore.activeCount
        case 'completed':
          return todoStore.completedCount
        default:
          return todoStore.allCount
      }
    }

    return {
      todoStore,
      newTodo,
      editingTodo,
      todoInput,
      editTodoInput,
      activeTab,
      newTodoDialog,
      editTodoDialog,
      currentPage,
      perPage,
      perPageOptions,
      pageMeta,
      openNewTodoDialog,
      openEditDialog,
      addNewTodo,
      updateTodoStatus,
      finishEditing,
      cancelEditing,
      deleteTodo,
      setFilter,
      changePage,
      changePerPage,
      paginationVisible,
      getFilteredTotalCount,
    }
  },
})
</script>

<style scoped>
.todo-container {
  max-width: 1000px;
  margin: 0 auto;
}

.filter-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.filter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.filter-active {
  border-color: var(--q-primary);
  background-color: rgba(25, 118, 210, 0.05);
}

.todo-list-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
</style>
