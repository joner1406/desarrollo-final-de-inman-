<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Gestión de Mantenimientos</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th v-if="userPermissions?.can_manage_mantenimientos" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="mantenimiento in mantenimientos" :key="mantenimiento.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ mantenimiento.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(mantenimiento.fechahora) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ mantenimiento.usuario_nombre }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ mantenimiento.equipo_tipo }} - {{ mantenimiento.equipo_modelo }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="mantenimiento.fechafin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ mantenimiento.fechafin ? 'Completado' : 'En progreso' }}
                </span>
              </td>
              <td v-if="userPermissions?.can_manage_mantenimientos" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  v-if="!mantenimiento.fechafin"
                  @click="completeMantenimiento(mantenimiento)"
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'MantenimientosView',
  setup() {
    const { userPermissions } = useAuth()
    const { apiCall } = useApi()

    const mantenimientos = ref([])

    const loadMantenimientos = async () => {
      try {
        mantenimientos.value = await apiCall('GET', '/api/actividades')
      } catch (error) {
        console.error('Error loading mantenimientos:', error)
      }
    }

    const completeMantenimiento = async (mantenimiento) => {
      try {
        await apiCall('POST', `/api/actividades/${mantenimiento.id}/completar`)
        mantenimiento.fechafin = new Date().toISOString()
        alert('Mantenimiento completado exitosamente')
      } catch (error) {
        alert('Error al completar mantenimiento: ' + error.message)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }

    onMounted(loadMantenimientos)

    return {
      userPermissions,
      mantenimientos,
      completeMantenimiento,
      formatDate
    }
  }
}
</script>
