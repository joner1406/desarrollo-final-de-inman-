<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Gestión de Equipos</h3>
        <button
          v-if="userPermissions?.can_manage_equipos"
          @click="showCreateModal = true"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <i class="fas fa-plus mr-2"></i>Agregar Equipo
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR</th>
              <th v-if="userPermissions?.can_manage_equipos" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="equipo in equipos" :key="equipo.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ equipo.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ equipo.tipo_equipo }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ equipo.marca_nombre }}</div>
                <div class="text-sm text-gray-500">{{ equipo.modelo }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(equipo.estado)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ equipo.estado }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <button @click="showQRCode(equipo)" class="text-indigo-600 hover:text-indigo-900">
                  <i class="fas fa-qrcode"></i>
                </button>
              </td>
              <td v-if="userPermissions?.can_manage_equipos" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="deleteEquipo(equipo)" class="text-red-600 hover:text-red-900">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Equipment Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Agregar Nuevo Equipo</h3>
        <form @submit.prevent="createEquipo">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tipo de Equipo</label>
              <select v-model="equipoForm.tipoEquipo_id" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar tipo</option>
                <option v-for="tipo in tiposEquipo" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Marca</label>
              <select v-model="equipoForm.marca_id" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Seleccionar marca</option>
                <option v-for="marca in marcas" :key="marca.id" :value="marca.id">{{ marca.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Modelo</label>
              <input v-model="equipoForm.modelo" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Procesador</label>
              <input v-model="equipoForm.procesador" type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">RAM</label>
              <input v-model="equipoForm.RAM" type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Disco</label>
              <input v-model="equipoForm.disco" type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea v-model="equipoForm.descripcion" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
              Cancelar
            </button>
            <button type="submit" :disabled="submitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {{ submitting ? 'Creando...' : 'Crear Equipo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'EquiposView',
  setup() {
    const { userPermissions } = useAuth()
    const { apiCall, loading } = useApi()

    const equipos = ref([])
    const tiposEquipo = ref([])
    const marcas = ref([])
    const showCreateModal = ref(false)
    const submitting = ref(false)
    const equipoForm = ref({
      tipoEquipo_id: '',
      marca_id: '',
      modelo: '',
      procesador: '',
      RAM: '',
      disco: '',
      descripcion: ''
    })

    const loadEquipos = async () => {
      try {
        equipos.value = await apiCall('GET', '/api/equipos')
      } catch (error) {
        console.error('Error loading equipos:', error)
      }
    }

    const loadBaseData = async () => {
      try {
        const [tiposResponse, marcasResponse] = await Promise.all([
          apiCall('GET', '/api/tipos-equipo'),
          apiCall('GET', '/api/marcas')
        ])
        tiposEquipo.value = tiposResponse
        marcas.value = marcasResponse
      } catch (error) {
        console.error('Error loading base data:', error)
      }
    }

    const createEquipo = async () => {
      submitting.value = true
      try {
        await apiCall('POST', '/api/equipos', equipoForm.value)
        showCreateModal.value = false
        equipoForm.value = {
          tipoEquipo_id: '',
          marca_id: '',
          modelo: '',
          procesador: '',
          RAM: '',
          disco: '',
          descripcion: ''
        }
        await loadEquipos()
        alert('Equipo creado exitosamente')
      } catch (error) {
        alert('Error al crear equipo: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    const deleteEquipo = async (equipo) => {
      if (!confirm(`¿Estás seguro de eliminar ${equipo.modelo}?`)) return

      try {
        await apiCall('DELETE', `/api/equipos/${equipo.id}`)
        equipos.value = equipos.value.filter(e => e.id !== equipo.id)
        alert('Equipo eliminado exitosamente')
      } catch (error) {
        alert('Error al eliminar equipo: ' + error.message)
      }
    }

    const getStatusClass = (estado) => {
      const classes = {
        'Disponible': 'bg-green-100 text-green-800',
        'En mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Dañado': 'bg-red-100 text-red-800'
      }
      return classes[estado] || 'bg-gray-100 text-gray-800'
    }

    const showQRCode = (equipo) => {
      alert(`Código QR: ${equipo.codigo_qr}`)
    }

    onMounted(async () => {
      await Promise.all([loadEquipos(), loadBaseData()])
    })

    return {
      userPermissions,
      equipos,
      tiposEquipo,
      marcas,
      showCreateModal,
      submitting,
      equipoForm,
      loading,
      createEquipo,
      deleteEquipo,
      getStatusClass,
      showQRCode
    }
  }
}
</script>
