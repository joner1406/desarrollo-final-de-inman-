<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Equipos</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats?.equipos_stats?.total || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-desktop text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Disponibles</p>
            <p class="text-3xl font-bold text-green-600">{{ stats?.equipos_stats?.disponibles || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check-circle text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">En Mantenimiento</p>
            <p class="text-3xl font-bold text-yellow-600">{{ stats?.equipos_stats?.mantenimiento || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <i class="fas fa-tools text-yellow-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Reportes Activos</p>
            <p class="text-3xl font-bold text-red-600">{{ stats?.reportes_activos || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Estado de Equipos</h3>
        <canvas id="equiposChart" width="400" height="200"></canvas>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Reportes Recientes</h3>
        <div class="space-y-3">
          <div
            v-for="reporte in stats?.reportes_recientes || []"
            :key="reporte.id"
            class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div class="h-2 w-2 bg-red-500 rounded-full mt-2"></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ reporte.equipo }}</p>
              <p class="text-xs text-gray-600">{{ reporte.observacion }}</p>
              <p class="text-xs text-gray-500">{{ reporte.fecha }}</p>
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
