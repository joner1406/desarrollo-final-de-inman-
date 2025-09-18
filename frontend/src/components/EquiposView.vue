<template>
  <div class="space-y-8">
    <div class="card-elevated p-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900 font-heading">Gestión de Equipos</h3>
        <button
          v-if="userPermissions?.can_manage_equipos"
          @click="openCreateModal"
          class="btn-primary"
          type="button"
        >
          <i class="fas fa-plus mr-2"></i>Agregar Equipo
        </button>
        <!-- DEBUG: Botón siempre visible para pruebas -->
        <button
          v-if="!userPermissions?.can_manage_equipos"
          @click="debugPermissions"
          class="bg-yellow-500 text-white px-4 py-2 rounded"
          type="button"
        >
          DEBUG: Sin permisos - Click aquí
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-600">Cargando equipos...</p>
      </div>

      <!-- Empty state when no equipment -->
      <div v-else-if="equipos.length === 0" class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div class="icon-large bg-gray-100 mx-auto mb-6">
          <i class="fas fa-desktop text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 font-heading mb-2">No hay equipos registrados</h3>
        <p class="text-gray-500 font-body">Los equipos aparecerán aquí cuando sean agregados al sistema.</p>
      </div>

      <!-- Equipment cards when there are records -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="equipo in equipos" :key="equipo.id"
             class="card-elevated p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="icon-container bg-indigo-100">
                <i class="fas fa-desktop text-indigo-600 text-xl"></i>
              </div>
              <div>
                <h4 class="text-lg font-semibold text-gray-900 font-heading">{{ equipo.tipo_equipo }}</h4>
                <p class="text-sm text-gray-500 font-body">ID: {{ equipo.id }}</p>
              </div>
            </div>
            <span :class="getStatusClass(equipo.estado_nombre || equipo.estado)" class="status-badge">
              {{ equipo.estado_nombre || equipo.estado }}
            </span>
          </div>

          <div class="space-y-3 mb-4">
            <div>
              <p class="text-xs text-gray-500 font-medium font-body uppercase tracking-wide">Marca</p>
              <p class="text-sm font-medium text-gray-900 font-body">{{ equipo.marca_nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-medium font-body uppercase tracking-wide">Modelo</p>
              <p class="text-sm font-medium text-gray-900 font-body">{{ equipo.modelo }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <button @click="showQRCode(equipo)"
                    class="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-indigo-50"
                    type="button">
              <i class="fas fa-qrcode text-lg"></i>
              <span class="text-sm font-medium font-body">QR</span>
            </button>

            <button v-if="userPermissions?.can_manage_equipos"
                    @click="deleteEquipo(equipo)"
                    class="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                    type="button">
              <i class="fas fa-trash text-lg"></i>
              <span class="text-sm font-medium font-body">Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQRModal" class="modal-overlay" @click.self="closeQRModal">
      <div class="modal-content" :class="{ 'show': showQRModal }">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Código QR del Equipo</h3>
        <div v-if="selectedEquipo" class="text-center space-y-6">
          <div class="bg-white p-6 rounded-xl border-2 border-gray-200">
            <div class="text-lg font-semibold text-gray-900 font-body mb-4">
              {{ selectedEquipo.tipo_equipo }} - {{ selectedEquipo.modelo }}
            </div>
            <div class="bg-gray-100 p-4 rounded-lg">
              <div class="text-sm text-gray-600 font-body mb-2">Código QR:</div>
              <div class="text-xl font-mono font-bold text-gray-900">{{ selectedEquipo.codigo_qr }}</div>
            </div>
            <div class="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <i class="fas fa-qrcode text-6xl text-gray-400"></i>
              <p class="text-sm text-gray-500 mt-2">QR Code generado automáticamente</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-4 pt-4">
          <button type="button" @click="closeQRModal" class="btn-secondary">
            Cerrar
          </button>
          <button type="button" @click="copyQRCode" class="btn-primary">
            <i class="fas fa-copy mr-2"></i>Copiar Código
          </button>
        </div>
      </div>
    </div>

    <!-- Create Equipment Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content" :class="{ 'show': showCreateModal }">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Agregar Nuevo Equipo</h3>
        
        <!-- Debug info - REMOVIDO -->
        <!-- <div v-if="showDebugInfo" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Tipos disponibles: {{ tiposEquipo.length }}</p>
          <p>Marcas disponibles: {{ marcas.length }}</p>
          <p>Form data: {{ JSON.stringify(equipoForm, null, 2) }}</p>
        </div> -->
        
        <form @submit.prevent="createEquipo" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Tipo de Equipo *</label>
              <select v-model="equipoForm.tipoEquipo_id" required class="form-input">
                <option value="">Seleccionar tipo</option>
                <option v-for="tipo in tiposEquipo" :key="tipo.id" :value="tipo.id">
                  {{ tipo.nombre }}
                </option>
              </select>
              <p v-if="tiposEquipo.length === 0" class="text-red-500 text-sm mt-1">
                No se pudieron cargar los tipos de equipo
              </p>
            </div>
            <div>
              <label class="form-label">Marca *</label>
              <select v-model="equipoForm.marca_id" required class="form-input">
                <option value="">Seleccionar marca</option>
                <option v-for="marca in marcas" :key="marca.id" :value="marca.id">
                  {{ marca.nombre }}
                </option>
              </select>
              <p v-if="marcas.length === 0" class="text-red-500 text-sm mt-1">
                No se pudieron cargar las marcas
              </p>
            </div>
            <div>
              <label class="form-label">Modelo *</label>
              <input v-model="equipoForm.modelo" type="text" required class="form-input" 
                     placeholder="Ej: ProDesk 600 G5">
            </div>
            <div>
              <label class="form-label">Procesador</label>
              <input v-model="equipoForm.procesador" type="text" class="form-input"
                     placeholder="Ej: Intel Core i5-10400">
            </div>
            <div>
              <label class="form-label">RAM</label>
              <input v-model="equipoForm.RAM" type="text" class="form-input"
                     placeholder="Ej: 8GB DDR4">
            </div>
            <div>
              <label class="form-label">Disco</label>
              <input v-model="equipoForm.disco" type="text" class="form-input"
                     placeholder="Ej: 500GB SSD">
            </div>
          </div>
          <div>
            <label class="form-label">Descripción</label>
            <textarea v-model="equipoForm.descripcion" rows="4" class="form-textarea"
                      placeholder="Descripción del equipo..."></textarea>
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {{ errorMessage }}
          </div>
          
          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" @click="closeCreateModal" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" :disabled="submitting || !isFormValid" 
                    class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {{ submitting ? 'Creando...' : 'Crear Equipo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'EquiposView',
  setup() {
    const { userPermissions, user } = useAuth()
    const { apiCall, loading } = useApi()

    const equipos = ref([])
    const tiposEquipo = ref([])
    const marcas = ref([])
    const showCreateModal = ref(false)
    const showQRModal = ref(false)
    const selectedEquipo = ref(null)
    const submitting = ref(false)
    const errorMessage = ref('')

    const equipoForm = ref({
      tipoEquipo_id: '',
      marca_id: '',
      modelo: '',
      procesador: '',
      RAM: '',
      disco: '',
      descripcion: ''
    })

    // Computed para validar el formulario
    const isFormValid = computed(() => {
      return equipoForm.value.tipoEquipo_id && 
             equipoForm.value.marca_id && 
             equipoForm.value.modelo.trim()
    })

    // Watch para debug de permisos
    watch(userPermissions, (newPerms) => {
      console.log('User permissions updated:', newPerms)
    }, { immediate: true, deep: true })

    const loadEquipos = async () => {
      try {
        console.log('Loading equipos...')
        const response = await apiCall('GET', '/api/equipos')
        equipos.value = response || []
        console.log('Equipos loaded:', equipos.value.length)
      } catch (error) {
        console.error('Error loading equipos:', error)
        errorMessage.value = 'Error al cargar equipos: ' + error.message
      }
    }

    const loadBaseData = async () => {
      try {
        console.log('Loading base data...')
        const [tiposResponse, marcasResponse] = await Promise.all([
          apiCall('GET', '/api/tipos-equipo'),
          apiCall('GET', '/api/marcas')
        ])
        tiposEquipo.value = tiposResponse || []
        marcas.value = marcasResponse || []
        console.log('Base data loaded - Tipos:', tiposEquipo.value.length, 'Marcas:', marcas.value.length)
      } catch (error) {
        console.error('Error loading base data:', error)
        errorMessage.value = 'Error al cargar datos base: ' + error.message
      }
    }

    const openCreateModal = () => {
      console.log('Opening create modal...')
      console.log('User permissions:', userPermissions.value)
      errorMessage.value = ''
      showCreateModal.value = true
    }

    const closeCreateModal = () => {
      showCreateModal.value = false
      errorMessage.value = ''
      // Reset form
      equipoForm.value = {
        tipoEquipo_id: '',
        marca_id: '',
        modelo: '',
        procesador: '',
        RAM: '',
        disco: '',
        descripcion: ''
      }
    }

    const createEquipo = async () => {
      console.log('Creating equipo with data:', equipoForm.value)
      submitting.value = true
      errorMessage.value = ''
      
      try {
        // Validar datos antes de enviar
        if (!equipoForm.value.tipoEquipo_id || !equipoForm.value.marca_id || !equipoForm.value.modelo) {
          throw new Error('Tipo de equipo, marca y modelo son requeridos')
        }

        const response = await apiCall('POST', '/api/equipos', equipoForm.value)
        console.log('Equipo created successfully:', response)
        
        closeCreateModal()
        await loadEquipos()
        
        // Usar una notificación más moderna en lugar de alert
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Éxito', {
            body: 'Equipo creado exitosamente',
            icon: '/favicon.ico'
          })
        } else {
          alert('Equipo creado exitosamente')
        }
      } catch (error) {
        console.error('Error creating equipo:', error)
        errorMessage.value = 'Error al crear equipo: ' + (error.message || 'Error desconocido')
      } finally {
        submitting.value = false
      }
    }

    const deleteEquipo = async (equipo) => {
      if (!confirm(`¿Estás seguro de eliminar ${equipo.modelo}?`)) return

      try {
        console.log('Deleting equipo:', equipo.id)
        await apiCall('DELETE', `/api/equipos/${equipo.id}`)
        equipos.value = equipos.value.filter(e => e.id !== equipo.id)
        alert('Equipo eliminado exitosamente')
      } catch (error) {
        console.error('Error deleting equipo:', error)
        alert('Error al eliminar equipo: ' + error.message)
      }
    }

    const getStatusClass = (estado) => {
      const classes = {
        'Disponible': 'bg-green-100 text-green-800',
        'En mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Dañado': 'bg-red-100 text-red-800',
        'En Uso': 'bg-blue-100 text-blue-800'
      }
      return classes[estado] || 'bg-gray-100 text-gray-800'
    }

    const showQRCode = (equipo) => {
      console.log('Showing QR for equipo:', equipo)
      selectedEquipo.value = equipo
      showQRModal.value = true
    }

    const closeQRModal = () => {
      showQRModal.value = false
      selectedEquipo.value = null
    }

    const copyQRCode = async () => {
      if (selectedEquipo.value?.codigo_qr) {
        try {
          await navigator.clipboard.writeText(selectedEquipo.value.codigo_qr)
          alert('Código QR copiado al portapapeles')
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = selectedEquipo.value.codigo_qr
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('Código QR copiado al portapapeles')
        }
      }
    }

    const debugPermissions = () => {
      console.log('=== DEBUG PERMISSIONS ===')
      console.log('User:', user.value)
      console.log('User permissions:', userPermissions.value)
      console.log('Can manage equipos:', userPermissions.value?.can_manage_equipos)
      alert(`Permisos: ${JSON.stringify(userPermissions.value, null, 2)}`)
    }

    onMounted(async () => {
      console.log('EquiposView mounted')
      console.log('Initial user permissions:', userPermissions.value)
      
      try {
        await Promise.all([loadEquipos(), loadBaseData()])
        console.log('Initial data loaded successfully')
      } catch (error) {
        console.error('Error during initial load:', error)
      }
    })

    return {
      userPermissions,
      user,
      equipos,
      tiposEquipo,
      marcas,
      showCreateModal,
      showQRModal,
      selectedEquipo,
      submitting,
      equipoForm,
      loading,
      errorMessage,
      isFormValid,
      openCreateModal,
      closeCreateModal,
      createEquipo,
      deleteEquipo,
      getStatusClass,
      showQRCode,
      closeQRModal,
      copyQRCode,
      debugPermissions
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 2xl;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  transform: scale(0.95);
  transition: transform 0.2s ease;
}

.modal-content.show {
  transform: scale(1);
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>