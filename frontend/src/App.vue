<template>
  <div id="app">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div class="text-center">
          <div class="mx-auto h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            INMAN
          </div>
          <h2 class="mt-6 text-3xl font-bold text-gray-900">INMAN</h2>
          <p class="mt-2 text-sm text-gray-600">Sistema de Gestión de Inventario y Mantenimiento</p>
          <p class="text-xs text-gray-500">SENA - Centro de Biotecnología Agropecuaria</p>
        </div>

        <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="loginForm.email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
          </div>

          <div v-if="loginError" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-sm text-red-600">{{ loginError }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoggingIn"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="!isLoggingIn">Iniciar Sesión</span>
            <span v-else class="flex items-center">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              Iniciando...
            </span>
          </button>

          <div class="mt-4 text-xs text-gray-500 text-center">
            <p><strong>Usuarios de prueba:</strong></p>
            <p>Admin: admin@cba.sena.edu.co / password123</p>
            <p>Técnico: acarrillo@cba.sena.edu.co / password123</p>
            <p>Instructor: instructor@cba.sena.edu.co / password123</p>
            <p>Aprendiz: aprendiz@cba.sena.edu.co / password123</p>
          </div>
        </form>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <div class="flex-shrink-0 w-64 bg-indigo-800">
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-center h-16 bg-indigo-900">
            <div class="h-10 w-10 rounded-full bg-white text-indigo-800 flex items-center justify-center font-bold mr-3">
              INMAN
            </div>
            <span class="text-white text-xl font-bold">INMAN</span>
          </div>

          <nav class="flex-1 px-4 py-4 space-y-2">
            <a
              v-for="item in availableModules"
              :key="item.id"
              @click="setActiveModule(item.id)"
              :class="{'bg-indigo-700 text-white': activeModule === item.id, 'text-indigo-100 hover:bg-indigo-700': activeModule !== item.id}"
              class="group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors"
            >
              <i :class="item.icon" class="mr-3 h-5 w-5"></i>
              {{ item.name }}
            </a>
          </nav>

          <div class="p-4 border-t border-indigo-700">
            <div class="flex items-center space-x-3">
              <div class="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{ currentUser?.nombre?.charAt(0) }}</span>
              </div>
              <div class="flex-1">
                <p class="text-white text-sm font-medium">{{ currentUser?.nombre }}</p>
                <p class="text-indigo-300 text-xs">{{ currentUser?.perfil }}</p>
              </div>
              <button @click="handleLogout" class="text-indigo-300 hover:text-white">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-semibold text-gray-900">{{ getModuleTitle() }}</h1>
          </div>
        </header>

        <!-- Content Area -->
        <main class="flex-1 overflow-y-auto page-container">
          <div v-if="loading" class="loading-overlay">
            <div class="flex flex-col items-center space-y-4">
              <div class="loading-spinner"></div>
              <p class="text-gray-600 font-body">Cargando...</p>
            </div>
          </div>

          <div v-else class="content-wrapper">
            <transition name="fade" mode="out-in">
              <component :is="currentComponent" class="fade-in-up" />
            </transition>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

// Import components
import DashboardView from './components/DashboardView.vue'
import EquiposView from './components/EquiposView.vue'
import ReportesView from './components/ReportesView.vue'
import MonitoreoView from './components/MonitoreoView.vue'
import MantenimientosView from './components/MantenimientosView.vue'
import QRScannerView from './components/QRScannerView.vue'

export default {
  name: 'App',
  components: {
    DashboardView,
    EquiposView,
    ReportesView,
    MonitoreoView,
    MantenimientosView,
    QRScannerView
  },
  setup() {
    const { currentUser, userPermissions, isAuthenticated, availableModules, login, logout, checkAuth } = useAuth()

    const activeModule = ref('dashboard')
    const isLoggingIn = ref(false)
    const loading = ref(false)
    const loginError = ref('')
    const loginForm = ref({ email: '', password: '' })

    const currentComponent = computed(() => {
      const components = {
        dashboard: 'DashboardView',
        equipos: 'EquiposView',
        reportes: 'ReportesView',
        monitoreo: 'MonitoreoView',
        mantenimientos: 'MantenimientosView',
        qr: 'QRScannerView'
      }
      return components[activeModule.value] || 'DashboardView'
    })

    const handleLogin = async () => {
      isLoggingIn.value = true
      loginError.value = ''

      const result = await login(loginForm.value)

      if (result.success) {
        // Set default module based on permissions
        if (availableModules.value.length > 0) {
          activeModule.value = availableModules.value[0].id
        }
      } else {
        loginError.value = result.error
      }

      isLoggingIn.value = false
    }

    const handleLogout = async () => {
      await logout()
      activeModule.value = 'dashboard'
      loginForm.value = { email: '', password: '' }
    }

    const setActiveModule = (module) => {
      if (userPermissions.value?.modules?.includes(module)) {
        activeModule.value = module
      }
    }

    const getModuleTitle = () => {
      const titles = {
        dashboard: 'Panel de Control',
        equipos: 'Gestión de Equipos',
        reportes: 'Reportes e Incidencias',
        monitoreo: 'Monitoreo de Aulas',
        qr: 'Escáner QR',
        mantenimientos: 'Gestión de Mantenimientos'
      }
      return titles[activeModule.value] || 'INMAN'
    }

    onMounted(async () => {
      loading.value = true
      await checkAuth()
      loading.value = false
    })

    return {
      // Auth
      currentUser,
      userPermissions,
      isAuthenticated,
      availableModules,

      // UI State
      activeModule,
      currentComponent,
      isLoggingIn,
      loading,
      loginError,
      loginForm,

      // Methods
      handleLogin,
      handleLogout,
      setActiveModule,
      getModuleTitle
    }
  }
}
</script>
