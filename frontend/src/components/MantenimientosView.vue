<template>
  <div class="space-y-8">
    <div class="card-elevated p-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900 font-heading">Gestión de Mantenimientos</h3>
      </div>

      <!-- Empty state when no maintenance records -->
      <div v-if="mantenimientos.length === 0" class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div class="icon-large bg-gray-100 mx-auto mb-6">
          <i class="fas fa-tools text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 font-heading mb-2">No hay mantenimientos registrados</h3>
        <p class="text-gray-500 font-body">Los registros de mantenimiento aparecerán aquí cuando se realicen trabajos de mantenimiento en los equipos.</p>
      </div>

      <!-- Maintenance table when there are records -->
      <div v-else class="space-y-4">
        <div v-for="mantenimiento in mantenimientos" :key="mantenimiento.id"
             class="card-elevated p-6 hover:shadow-lg transition-all duration-300">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div class="flex-1 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold text-gray-900 font-heading">
                  Mantenimiento #{{ mantenimiento.id }}
                </h4>
                <span :class="mantenimiento.fechafin ? 'status-success' : 'status-warning'" class="status-badge">
                  {{ mantenimiento.fechafin ? 'Completado' : 'En progreso' }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div class="space-y-1">
                  <p class="text-gray-500 font-medium font-body uppercase tracking-wide text-xs">Fecha</p>
                  <p class="text-gray-900 font-body">{{ formatDate(mantenimiento.fechahora) }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-gray-500 font-medium font-body uppercase tracking-wide text-xs">Técnico</p>
                  <p class="text-gray-900 font-body">{{ mantenimiento.usuario_nombre }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-gray-500 font-medium font-body uppercase tracking-wide text-xs">Equipo</p>
                  <p class="text-gray-900 font-body">{{ mantenimiento.equipo_tipo }} - {{ mantenimiento.equipo_modelo }}</p>
                </div>
              </div>
            </div>

            <div v-if="userPermissions?.can_manage_mantenimientos && currentUser?.perfil === 'tecnico' && !mantenimiento.fechafin" class="flex-shrink-0">
              <button
                @click="completeMantenimiento(mantenimiento)"
                :disabled="completing === mantenimiento.id"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i v-if="completing === mantenimiento.id" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-check mr-2"></i>
                {{ completing === mantenimiento.id ? 'Completando...' : 'Completar' }}
              </button>
            </div>
          </div>
        </div>
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
    const { userPermissions, currentUser } = useAuth()
    const { apiCall } = useApi()

    const mantenimientos = ref([])
    const completing = ref(null)

    const loadMantenimientos = async () => {
      try {
        const all = await apiCall('GET', '/api/actividades')
        // Solo mostrar actividades de tipo 'mantenimiento' y mapear fecha para la vista
        mantenimientos.value = (all || [])
          .filter(a => a.tipo_actividad === 'mantenimiento')
          .map(a => ({
            ...a,
            fechahora: a.fecha_actividad || a.fechahora || a.created_at || null
          }))
      } catch (error) {
        console.error('Error loading mantenimientos:', error)
      }
    }

    const completeMantenimiento = async (mantenimiento) => {
      if (!confirm(`¿Estás seguro de marcar como completado el mantenimiento #${mantenimiento.id}?`)) return

      completing.value = mantenimiento.id
      try {
        await apiCall('POST', `/api/actividades/${mantenimiento.id}/completar`)
        mantenimiento.fechafin = new Date().toISOString()
        alert('Mantenimiento completado exitosamente')
      } catch (error) {
        const msg = error?.response?.data?.error || error.message
        alert('Error al completar mantenimiento: ' + msg)
      } finally {
        completing.value = null
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
      currentUser,
      mantenimientos,
      completing,
      completeMantenimiento,
      formatDate
    }
  }
}
</script>
