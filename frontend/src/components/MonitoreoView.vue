<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Monitoreo de Aulas</h3>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Seleccionar Ambiente</label>
        <select v-model="selectedArea" @change="loadAulaLayout"
                class="px-3 py-2 border border-gray-300 rounded-md w-full md:w-1/3">
          <option value="">Seleccionar ambiente</option>
          <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.nombre }}</option>
        </select>
      </div>

      <div v-if="selectedArea" class="space-y-6">
        <div class="flex justify-between items-center">
          <h4 class="text-md font-medium text-gray-900">Layout del Aula</h4>
        </div>

        <!-- Equipment Grid -->
        <div class="bg-gray-100 p-6 rounded-lg">
          <div class="grid grid-cols-6 gap-4">
            <div v-for="(equipo, index) in aulaEquipos" :key="index"
                 :class="getEquipmentStatusClass(equipo.estado)"
                 class="h-16 rounded-lg flex items-center justify-center cursor-pointer transform hover:scale-105 transition-transform">
              <div class="text-center">
                <i class="fas fa-desktop text-lg mb-1"></i>
                <div class="text-xs">PC {{ index + 1 }}</div>
              </div>
            </div>

            <!-- Teacher's Desk -->
            <div class="col-span-2 h-16 bg-indigo-200 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <i class="fas fa-chalkboard-teacher text-indigo-600 text-lg mb-1"></i>
                <div class="text-xs text-indigo-800">Escritorio Instructor</div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-4 flex flex-wrap gap-4 text-xs">
            <div class="flex items-center">
              <div class="w-4 h-4 bg-green-200 border-2 border-green-500 rounded mr-2"></div>
              <span>Disponible</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-yellow-200 border-2 border-yellow-500 rounded mr-2"></div>
              <span>En mantenimiento</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-red-200 border-2 border-red-500 rounded mr-2"></div>
              <span>Con reportes</span>
            </div>
          </div>
        </div>

        <!-- Equipment Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-check text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Equipos Disponibles</p>
                <p class="text-2xl font-bold text-green-600">{{ aulaStats.disponibles }}</p>
              </div>
            </div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-tools text-yellow-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">En Mantenimiento</p>
                <p class="text-2xl font-bold text-yellow-600">{{ aulaStats.mantenimiento }}</p>
              </div>
            </div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Con Reportes</p>
                <p class="text-2xl font-bold text-red-600">{{ aulaStats.reportes }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

export default {
  name: 'MonitoreoView',
  setup() {
    const { apiCall } = useApi()

    const areas = ref([])
    const selectedArea = ref('')
    const aulaEquipos = ref([])
    const aulaStats = ref({ disponibles: 0, mantenimiento: 0, reportes: 0 })

    const loadAreas = async () => {
      try {
        areas.value = await apiCall('GET', '/api/areas')
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }

    const loadAulaLayout = () => {
      // Simulate loading classroom equipment
      aulaEquipos.value = Array(18).fill().map((_, index) => ({
        id: index + 1,
        tipo: 'computador',
        estado: ['disponible', 'mantenimiento', 'reportes'][Math.floor(Math.random() * 3)]
      }))

      aulaStats.value = {
        disponibles: aulaEquipos.value.filter(e => e.estado === 'disponible').length,
        mantenimiento: aulaEquipos.value.filter(e => e.estado === 'mantenimiento').length,
        reportes: aulaEquipos.value.filter(e => e.estado === 'reportes').length
      }
    }

    const getEquipmentStatusClass = (estado) => {
      const classes = {
        'disponible': 'bg-green-200 border-2 border-green-500 text-green-800',
        'mantenimiento': 'bg-yellow-200 border-2 border-yellow-500 text-yellow-800',
        'reportes': 'bg-red-200 border-2 border-red-500 text-red-800'
      }
      return classes[estado] || 'bg-gray-200 border-2 border-gray-500'
    }

    onMounted(loadAreas)

    return {
      areas,
      selectedArea,
      aulaEquipos,
      aulaStats,
      loadAulaLayout,
      getEquipmentStatusClass
    }
  }
}
</script>
