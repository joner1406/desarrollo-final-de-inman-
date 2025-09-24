<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Monitoreo de Equipos</h3>
      
      <!-- Filter Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Estado</label>
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <select v-model="selectedEstadoInput"
                  class="px-3 py-2 border border-gray-300 rounded-md w-full md:w-1/3">
            <option value="">Todos los Estados</option>
            <option value="Disponible">Solo Disponibles</option>
            <option value="Mantenimiento">En Mantenimiento</option>
            <option value="Dañado">Dañados</option>
            <option value="En Uso">En Uso</option>
          </select>
          <div class="flex gap-2">
            <button @click="applyFilter" class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Aplicar</button>
            <button @click="clearFilter" :disabled="!filterApplied && !selectedEstadoInput"
                    class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50">Limpiar</button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-600">Cargando equipos...</p>
      </div>

      <!-- Equipment Display -->
      <div v-else class="space-y-6">
        <!-- Show instruction until a filter is applied -->
        <div v-if="!filterApplied" class="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
          <div class="text-gray-400 mb-2"><i class="fas fa-filter text-3xl"></i></div>
          <p>Aplica un filtro para ver los equipos</p>
        </div>

        <template v-else>
          <!-- Stats Section -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-check text-green-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Disponibles</p>
                  <p class="text-2xl font-bold text-green-600">{{ stats.disponibles }}</p>
                </div>
              </div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-play text-blue-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">En Uso</p>
                  <p class="text-2xl font-bold text-blue-600">{{ stats.enUso }}</p>
                </div>
              </div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-tools text-yellow-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Mantenimiento</p>
                  <p class="text-2xl font-bold text-yellow-600">{{ stats.mantenimiento }}</p>
                </div>
              </div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-exclamation-triangle text-red-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Dañados</p>
                  <p class="text-2xl font-bold text-red-600">{{ stats.danados }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Equipment Grid -->
          <div class="bg-gray-100 p-6 rounded-lg">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-md font-medium text-gray-900">
                Vista de Equipos 
                <span class="text-sm text-gray-500">({{ filteredEquipos.length }} equipos)</span>
              </h4>
              <button @click="refreshData" :disabled="loading"
                      class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50">
                <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync'" class="mr-1"></i>
                Actualizar
              </button>
            </div>

            <!-- Equipment Cards Grid -->
            <div v-if="filteredEquipos.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="equipo in filteredEquipos" :key="equipo.id" 
                   :class="getEquipmentStatusClass(equipo.estado_nombre)"
                   class="p-4 rounded-lg cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-sm"
                   @click="showEquipmentDetails(equipo)">
                <div class="text-center">
                  <i :class="getEquipmentIcon(equipo.tipo_equipo)" class="text-2xl mb-2"></i>
                  <div class="text-sm font-medium">{{ equipo.tipo_equipo }}</div>
                  <div class="text-xs text-gray-600">{{ equipo.marca_nombre }}</div>
                  <div class="text-xs font-mono mt-1">{{ equipo.modelo }}</div>
                  <div class="text-xs mt-2 px-2 py-1 rounded" 
                       :class="getStatusBadgeClass(equipo.estado_nombre)">
                    {{ equipo.estado_nombre }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State when filter applied but no results -->
            <div v-else class="text-center py-8">
              <div class="text-gray-400 mb-2">
                <i class="fas fa-search text-3xl"></i>
              </div>
              <p class="text-gray-600">
                {{ appliedEstado ? 'No hay equipos con este estado' : 'No hay equipos registrados' }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Equipment Details Modal -->
      <div v-if="showModal && selectedEquipo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
        <div class="bg-white p-6 rounded-lg max-w-2xl w-full m-4 max-h-96 overflow-y-auto">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Detalles del Equipo</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Tipo:</p>
              <p class="font-medium">{{ selectedEquipo.tipo_equipo }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Estado:</p>
              <span :class="getStatusBadgeClass(selectedEquipo.estado_nombre)" class="px-2 py-1 rounded text-xs">
                {{ selectedEquipo.estado_nombre }}
              </span>
            </div>
            <div>
              <p class="text-sm text-gray-600">Marca:</p>
              <p class="font-medium">{{ selectedEquipo.marca_nombre }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Modelo:</p>
              <p class="font-medium">{{ selectedEquipo.modelo || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Procesador:</p>
              <p class="font-medium">{{ selectedEquipo.procesador || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">RAM:</p>
              <p class="font-medium">{{ selectedEquipo.RAM || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Disco:</p>
              <p class="font-medium">{{ selectedEquipo.disco || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Código QR:</p>
              <p class="font-medium font-mono text-sm">{{ selectedEquipo.codigo_qr || 'N/A' }}</p>
            </div>
          </div>
          
          <div v-if="selectedEquipo.descripcion" class="mt-4">
            <p class="text-sm text-gray-600">Descripción:</p>
            <p class="font-medium">{{ selectedEquipo.descripcion }}</p>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button @click="closeModal" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cerrar
            </button>
            <button v-if="selectedEquipo.codigo_qr" @click="copyQRCode" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Copiar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

export default {
  name: 'MonitoreoView',
  setup() {
    const { apiCall, loading } = useApi()
    
    const equipos = ref([])
    const selectedEstadoInput = ref('')
    const appliedEstado = ref('')
    const filterApplied = ref(false)
    const showModal = ref(false)
    const selectedEquipo = ref(null)

    // Computed para equipos filtrados
    const filteredEquipos = computed(() => {
      if (!filterApplied.value) return []
      if (!appliedEstado.value) return equipos.value
      return equipos.value.filter(equipo => equipo.estado_nombre === appliedEstado.value)
    })

    // Computed para estadísticas
    const stats = computed(() => {
      return {
        disponibles: equipos.value.filter(e => e.estado_nombre === 'Disponible').length,
        enUso: equipos.value.filter(e => e.estado_nombre === 'En Uso').length,
        mantenimiento: equipos.value.filter(e => e.estado_nombre === 'Mantenimiento').length,
        danados: equipos.value.filter(e => e.estado_nombre === 'Dañado').length
      }
    })

    const loadEquipos = async () => {
      try {
        console.log('Loading equipos for monitoring...')
        const response = await apiCall('GET', '/api/equipos')
        equipos.value = response || []
        console.log(`Loaded ${equipos.value.length} equipos`)
      } catch (error) {
        console.error('Error loading equipos:', error)
        equipos.value = []
      }
    }

    const refreshData = async () => {
      await loadEquipos()
    }

    const applyFilter = () => {
      appliedEstado.value = selectedEstadoInput.value
      filterApplied.value = true
    }

    const clearFilter = () => {
      selectedEstadoInput.value = ''
      appliedEstado.value = ''
      filterApplied.value = false
    }

    const getEquipmentIcon = (tipo) => {
      const iconMap = {
        'Computador de Escritorio': 'fas fa-desktop',
        'Laptop': 'fas fa-laptop',
        'Monitor': 'fas fa-tv',
        'Impresora': 'fas fa-print',
        'Proyector': 'fas fa-video'
      }
      return iconMap[tipo] || 'fas fa-desktop'
    }

    const getEquipmentStatusClass = (estado) => {
      const classes = {
        'Disponible': 'bg-green-200 border-2 border-green-500 text-green-800',
        'En Uso': 'bg-blue-200 border-2 border-blue-500 text-blue-800',
        'Mantenimiento': 'bg-yellow-200 border-2 border-yellow-500 text-yellow-800',
        'Dañado': 'bg-red-200 border-2 border-red-500 text-red-800'
      }
      return classes[estado] || 'bg-gray-200 border-2 border-gray-500 text-gray-800'
    }

    const getStatusBadgeClass = (estado) => {
      const classes = {
        'Disponible': 'bg-green-100 text-green-800',
        'En Uso': 'bg-blue-100 text-blue-800',
        'Mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Dañado': 'bg-red-100 text-red-800'
      }
      return classes[estado] || 'bg-gray-100 text-gray-800'
    }

    const showEquipmentDetails = (equipo) => {
      selectedEquipo.value = equipo
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      selectedEquipo.value = null
    }

    const copyQRCode = async () => {
      if (selectedEquipo.value?.codigo_qr) {
        try {
          await navigator.clipboard.writeText(selectedEquipo.value.codigo_qr)
          alert('Código QR copiado al portapapeles')
        } catch (error) {
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

    onMounted(async () => {
      console.log('MonitoreoView mounted')
      await loadEquipos()
    })

    return {
      equipos,
      filteredEquipos,
      selectedEstadoInput,
      appliedEstado,
      filterApplied,
      stats,
      loading,
      showModal,
      selectedEquipo,
      refreshData,
      applyFilter,
      clearFilter,
      getEquipmentIcon,
      getEquipmentStatusClass,
      getStatusBadgeClass,
      showEquipmentDetails,
      closeModal,
      copyQRCode
    }
  }
}
</script>