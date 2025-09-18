<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-600 font-body uppercase tracking-wide">Total Equipos</p>
            <p class="text-4xl font-bold text-gray-900 font-heading">{{ stats?.equipos_stats?.total || 0 }}</p>
          </div>
          <div class="icon-container bg-blue-100">
            <i class="fas fa-desktop text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-600 font-body uppercase tracking-wide">Disponibles</p>
            <p class="text-4xl font-bold text-green-600 font-heading">{{ stats?.equipos_stats?.disponibles || 0 }}</p>
          </div>
          <div class="icon-container bg-green-100">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-600 font-body uppercase tracking-wide">En Mantenimiento</p>
            <p class="text-4xl font-bold text-yellow-600 font-heading">{{ stats?.equipos_stats?.mantenimiento || 0 }}</p>
          </div>
          <div class="icon-container bg-yellow-100">
            <i class="fas fa-tools text-yellow-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-600 font-body uppercase tracking-wide">Reportes Activos</p>
            <p class="text-4xl font-bold text-red-600 font-heading">{{ stats?.reportes_activos || 0 }}</p>
          </div>
          <div class="icon-container bg-red-100">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card-elevated p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Estado de Equipos</h3>
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
          <canvas id="equiposChart" width="400" height="250" class="mx-auto"></canvas>
        </div>
      </div>

      <div class="card-elevated p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Reportes Recientes</h3>

        <!-- Empty state for recent reports -->
        <div v-if="!stats?.reportes_recientes || stats.reportes_recientes.length === 0"
             class="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div class="icon-large bg-gray-100 mx-auto mb-4">
            <i class="fas fa-clipboard-list text-3xl text-gray-400"></i>
          </div>
          <p class="text-gray-500 font-body">No hay reportes recientes</p>
        </div>

        <!-- Recent reports list -->
        <div v-else class="space-y-4">
          <div
            v-for="reporte in stats.reportes_recientes"
            :key="reporte.id"
            class="card-elevated p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-red-500"
          >
            <div class="flex items-start space-x-4">
              <div class="icon-container bg-red-100 flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-gray-900 font-body">{{ reporte.equipo }}</p>
                  <span class="text-xs text-gray-500 font-body">{{ reporte.fecha }}</span>
                </div>
                <p class="text-sm text-gray-600 font-body">{{ reporte.observacion }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { useApi } from '../composables/useApi'

export default {
  name: 'DashboardView',
  setup() {
    const { apiCall, loading, error } = useApi()
    const stats = ref(null)

    const loadStats = async () => {
      try {
        stats.value = await apiCall('GET', '/api/dashboard/stats')
        nextTick(() => initChart())
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }

    const initChart = () => {
      const ctx = document.getElementById('equiposChart')
      if (ctx && stats.value && window.Chart) {
        const equiposStats = stats.value.equipos_stats
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Disponibles', 'En Mantenimiento', 'Dañados'],
            datasets: [{
              data: [equiposStats.disponibles, equiposStats.mantenimiento, equiposStats.danados],
              backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        })
      }
    }

    onMounted(loadStats)

    return {
      stats,
      loading,
      error
    }
  }
}
</script>
