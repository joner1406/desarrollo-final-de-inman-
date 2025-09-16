<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Reportes e Incidencias</h3>
        <button
          v-if="userPermissions?.can_create_reportes || userPermissions?.can_manage_reportes"
          @click="showReporteModal = true"
          class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          <i class="fas fa-plus mr-2"></i>Nuevo Reporte
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th v-if="userPermissions?.can_manage_reportes" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="reporte in reportes" :key="reporte.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reporte.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(reporte.fechahora) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reporte.usuario_nombre }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ reporte.equipo_tipo }} - {{ reporte.equipo_modelo }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="reporte.resuelto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ reporte.resuelto ? 'Resuelto' : 'Activo' }}
                </span>
              </td>
              <td v-if="userPermissions?.can_manage_reportes" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  v-if="!reporte.resuelto"
                  @click="resolveReporte(reporte)"
                  class="text-green-600 hover:text-green-900"
                >
                  <i class="fas fa-check"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Report Form Modal -->
    <div v-if="showReporteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Nuevo Reporte de Incidencia</h3>
        <form @submit.prevent="createReporte">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Área</label>
              <select v-model="reporteForm.area" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar área</option>
                <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Espacio</label>
              <select v-model="reporteForm.espacio" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar espacio</option>
                <option v-for="espacio in filteredEspacios" :key="espacio.id" :value="espacio.id">{{ espacio.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Equipo</label>
              <select v-model="reporteForm.equipo" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar equipo</option>
                <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                  {{ equipo.tipo_equipo }} - {{ equipo.marca_nombre }} {{ equipo.modelo }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Descripción del problema</label>
              <textarea v-model="reporteForm.observacion" required rows="4"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="showReporteModal = false"
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
              Cancelar
            </button>
            <button type="submit" :disabled="submitting"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
              {{ submitting ? 'Creando...' : 'Crear Reporte' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'ReportesView',
  setup() {
    const { userPermissions } = useAuth()
    const { apiCall } = useApi()

    const reportes = ref([])
    const equipos = ref([])
    const areas = ref([])
    const espacios = ref([])
    const showReporteModal = ref(false)
    const submitting = ref(false)
    const reporteForm = ref({
      area: '',
      espacio: '',
      equipo: '',
      observacion: ''
    })

    const filteredEspacios = computed(() => {
      return espacios.value.filter(espacio => espacio.area_id == reporteForm.value.area)
    })

    const loadReportes = async () => {
      try {
        reportes.value = await apiCall('GET', '/api/reportes')
      } catch (error) {
        console.error('Error loading reportes:', error)
      }
    }

    const loadBaseData = async () => {
      try {
        const [equiposResponse, areasResponse, espaciosResponse] = await Promise.all([
          apiCall('GET', '/api/equipos'),
          apiCall('GET', '/api/areas'),
          apiCall('GET', '/api/espacios')
        ])
        equipos.value = equiposResponse
        areas.value = areasResponse
        espacios.value = espaciosResponse
      } catch (error) {
        console.error('Error loading base data:', error)
      }
    }

    const createReporte = async () => {
      submitting.value = true
      try {
        await apiCall('POST', '/api/reportes', reporteForm.value)
        showReporteModal.value = false
        reporteForm.value = { area: '', espacio: '', equipo: '', observacion: '' }
        await loadReportes()
        alert('Reporte creado exitosamente')
      } catch (error) {
        alert('Error al crear reporte: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    const resolveReporte = async (reporte) => {
      try {
        await apiCall('POST', `/api/reportes/${reporte.id}/resolver`)
        reporte.resuelto = true
        alert('Reporte resuelto exitosamente')
      } catch (error) {
        alert('Error al resolver reporte: ' + error.message)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }

    onMounted(async () => {
      await Promise.all([loadReportes(), loadBaseData()])
    })

    return {
      userPermissions,
      reportes,
      equipos,
      areas,
      espacios,
      showReporteModal,
      submitting,
      reporteForm,
      filteredEspacios,
      createReporte,
      resolveReporte,
      formatDate
    }
  }
}
</script>
