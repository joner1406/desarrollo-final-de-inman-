<template>
  <div class="space-y-8">
    <div class="card-elevated p-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900 font-heading">Reportes e Incidencias</h3>
        <button
          v-if="userPermissions?.can_create_reportes || userPermissions?.can_manage_reportes"
          @click="openReporteModal"
          class="btn-danger"
          type="button"
        >
          <i class="fas fa-plus mr-2"></i>Nuevo Reporte
        </button>
        <!-- DEBUG: Botón siempre visible para pruebas -->
        <button
          v-if="!userPermissions?.can_create_reportes && !userPermissions?.can_manage_reportes"
          @click="debugPermissions"
          class="bg-yellow-500 text-white px-4 py-2 rounded"
          type="button"
        >
          DEBUG: Sin permisos reportes
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p class="mt-2 text-gray-600">Cargando reportes...</p>
      </div>

      <!-- Empty state when no reports -->
      <div v-else-if="reportes.length === 0" class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div class="icon-large bg-red-100 mx-auto mb-6">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 font-heading mb-2">No hay reportes registrados</h3>
        <p class="text-gray-500 font-body">Los reportes de incidencias aparecerán aquí cuando sean creados.</p>
      </div>

      <!-- Reports table when there are records -->
      <div v-else class="space-y-4">
        <div class="flex justify-end">
          <button @click="loadReportes" :disabled="loading" class="btn-secondary disabled:opacity-50">
            <i v-if="loading" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else class="fas fa-sync mr-2"></i>
            Actualizar listado
          </button>
        </div>
        <div class="overflow-x-auto bg-white rounded-lg shadow">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observación</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="reporte in reportes" :key="reporte.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 font-mono">#{{ reporte.id }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatDate(reporte.fechahora) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ reporte.usuario_nombre || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">
                  <span v-if="reporte.equipo_tipo || reporte.equipo_modelo">{{ reporte.equipo_tipo || '' }} <span v-if="reporte.equipo_tipo && reporte.equipo_modelo">-</span> {{ reporte.equipo_modelo || '' }}</span>
                  <span v-else>N/A</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 max-w-md truncate" :title="reporte.observacion">{{ reporte.observacion }}</td>
                <td class="px-4 py-3">
                  <span :class="reporte.resuelto ? 'status-success' : 'status-danger'" class="status-badge">
                    {{ reporte.resuelto ? 'Resuelto' : 'Activo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="(userPermissions?.can_manage_reportes || userPermissions?.can_send_to_maintenance || userPermissions?.can_create_reportes) && !reporte.resuelto"
                          @click="sendToMantenimiento(reporte)"
                          :disabled="resolving === reporte.id"
                          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    <i v-if="resolving === reporte.id" class="fas fa-spinner fa-spin mr-2"></i>
                    <i v-else class="fas fa-paper-plane mr-2"></i>
                    {{ resolving === reporte.id ? 'Enviando...' : 'Enviar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Report Form Modal -->
    <div v-if="showReporteModal" class="modal-overlay" @click.self="closeReporteModal">
      <div class="modal-content" :class="{ 'show': showReporteModal }">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Nuevo Reporte de Incidencia</h3>
        
        <!-- Debug info - REMOVIDO -->
        <!-- <div v-if="showDebugInfo" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Áreas disponibles: {{ areas.length }}</p>
          <p>Espacios disponibles: {{ espacios.length }}</p>
          <p>Equipos disponibles: {{ equipos.length }}</p>
          <p>Form data: {{ JSON.stringify(reporteForm, null, 2) }}</p>
        </div> -->
        
        <form @submit.prevent="createReporte" class="space-y-6">
          <div class="space-y-6">
            <!-- Simplificado: Solo equipo y observación por ahora -->
            <div>
              <label class="form-label">Equipo *</label>
              <select v-model="reporteForm.equipo" required class="form-input">
                <option value="">Seleccionar equipo</option>
                <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                  {{ equipo.tipo_equipo }} - {{ equipo.marca_nombre }} {{ equipo.modelo }}
                </option>
              </select>
              <p v-if="equipos.length === 0" class="text-red-500 text-sm mt-1">
                No se pudieron cargar los equipos
              </p>
            </div>
            
            <!-- Área (usar datos del API si existen; de lo contrario, opciones por defecto) -->
            <div>
              <label class="form-label">Área (Opcional)</label>
              <select v-model="reporteForm.area" class="form-input">
                <option value="">Seleccionar área</option>
                <option v-for="area in displayedAreas" :key="area.id" :value="area.id">{{ area.nombre }}</option>
              </select>
            </div>
            
            <!-- Espacio (filtrado por área seleccionada; usa datos API o por defecto) -->
            <div>
              <label class="form-label">Espacio (Opcional)</label>
              <select v-model="reporteForm.espacio" class="form-input">
                <option value="">Seleccionar espacio</option>
                <option v-for="espacio in filteredEspacios" :key="espacio.id" :value="espacio.id">{{ espacio.nombre }}</option>
              </select>
            </div>
            
            <div>
              <label class="form-label">Descripción del problema *</label>
              <textarea v-model="reporteForm.observacion" required rows="4" class="form-textarea" 
                        placeholder="Describe detalladamente el problema o incidencia..."></textarea>
            </div>
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {{ errorMessage }}
          </div>
          
          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" @click="closeReporteModal" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" :disabled="submitting || !isFormValid" 
                    class="btn-danger disabled:opacity-50 disabled:cursor-not-allowed">
              {{ submitting ? 'Creando...' : 'Crear Reporte' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'ReportesView',
  setup() {
    const { userPermissions, user } = useAuth()
    const { apiCall, loading } = useApi()

    const reportes = ref([])
    const equipos = ref([])
    const areas = ref([])
    const espacios = ref([])
    const showReporteModal = ref(false)
    const submitting = ref(false)
    const resolving = ref(null)
    const errorMessage = ref('')

    const reporteForm = ref({
      area: '',
      espacio: '',
      equipo: '',
      observacion: ''
    })

    // Defaults cuando la API no devuelve datos
    const defaultAreas = [
      { id: 'A', nombre: 'Bloque A' },
      { id: 'B', nombre: 'Bloque B' },
      { id: 'C', nombre: 'Bloque C' },
      { id: 'LAB', nombre: 'Laboratorio' }
    ]

    const defaultEspacios = [
      { id: 'A-101', area_id: 'A', nombre: 'Aula 101' },
      { id: 'A-102', area_id: 'A', nombre: 'Aula 102' },
      { id: 'B-201', area_id: 'B', nombre: 'Aula 201' },
      { id: 'LAB-1', area_id: 'LAB', nombre: 'Lab Sistemas' }
    ]

    const displayedAreas = computed(() => (areas.value && areas.value.length ? areas.value : defaultAreas))

    const allEspacios = computed(() => (espacios.value && espacios.value.length ? espacios.value : defaultEspacios))

    const filteredEspacios = computed(() => {
      const selectedArea = reporteForm.value.area
      return (allEspacios.value || []).filter(esp => selectedArea ? String(esp.area_id) == String(selectedArea) : true)
    })

    const isFormValid = computed(() => {
      return reporteForm.value.equipo && reporteForm.value.observacion.trim()
    })

    // Watch para debug de permisos
    watch(userPermissions, (newPerms) => {
      console.log('Reportes - User permissions updated:', newPerms)
    }, { immediate: true, deep: true })

    const loadReportes = async () => {
      try {
        console.log('Loading reportes...')
        // Crear un endpoint simplificado usando actividades si no existe reportes
        try {
          const response = await apiCall('GET', '/api/reportes')
          if (Array.isArray(response) && response.length > 0) {
            reportes.value = response
          } else {
            console.warn('No hay datos en /api/reportes, intentando cargar desde /api/actividades (fallback)')
            const allActivities = await apiCall('GET', '/api/actividades')
            const mapped = (allActivities || [])
              .filter(a => a.tipo_actividad === 'reporte')
              .map(a => ({
                id: a.id,
                fechahora: a.fecha_actividad || a.created_at || null,
                usuario_nombre: a.usuario_nombre,
                equipo_tipo: a.equipo_tipo,
                equipo_modelo: a.equipo_modelo,
                area_nombre: a.area_nombre || null,
                observacion: a.descripcion?.replace(/^Reporte:\s*/i, '') || a.descripcion,
                resuelto: false
              }))
            if (mapped.length > 0) {
              reportes.value = mapped
            } else {
              console.warn('Fallback sin resultados, manteniendo lista actual')
            }
          }
        } catch (error) {
          console.warn('No se pudo cargar /api/reportes, intentando alternativa')
          // Como alternativa, podríamos usar actividades
          try {
            const allActivities = await apiCall('GET', '/api/actividades')
            const mapped = (allActivities || [])
              .filter(a => a.tipo_actividad === 'reporte')
              .map(a => ({
                id: a.id,
                fechahora: a.fecha_actividad || a.created_at || null,
                usuario_nombre: a.usuario_nombre,
                equipo_tipo: a.equipo_tipo,
                equipo_modelo: a.equipo_modelo,
                area_nombre: a.area_nombre || null,
                observacion: a.descripcion?.replace(/^Reporte:\s*/i, '') || a.descripcion,
                resuelto: false
              }))
            if (mapped.length > 0) {
              reportes.value = mapped
            } else {
              console.warn('Fallback /api/actividades sin resultados, manteniendo lista actual')
            }
          } catch (fallbackError) {
            console.warn('Fallback /api/actividades también falló:', fallbackError?.message)
            // mantener lista actual
          }
        }
        console.log('Reportes loaded:', reportes.value.length)
      } catch (error) {
        console.error('Error loading reportes:', error)
        errorMessage.value = 'Error al cargar reportes: ' + error.message
        // mantener lista actual en caso de error
      }
    }

    const loadBaseData = async () => {
      try {
        console.log('Loading base data for reportes...')
        
        // Cargar equipos (obligatorio)
        const equiposResponse = await apiCall('GET', '/api/equipos')
        equipos.value = equiposResponse || []

        // Cargar áreas y espacios (opcional)
        try {
          const areasResponse = await apiCall('GET', '/api/areas')
          areas.value = areasResponse || []
        } catch (error) {
          console.warn('No se pudieron cargar áreas:', error.message)
          areas.value = []
        }

        try {
          const espaciosResponse = await apiCall('GET', '/api/espacios')
          espacios.value = espaciosResponse || []
        } catch (error) {
          console.warn('No se pudieron cargar espacios:', error.message)
          espacios.value = []
        }

        console.log('Base data loaded - Equipos:', equipos.value.length, 'Áreas:', areas.value.length, 'Espacios:', espacios.value.length)
      } catch (error) {
        console.error('Error loading base data:', error)
        errorMessage.value = 'Error al cargar datos base: ' + error.message
      }
    }

    const openReporteModal = () => {
      console.log('Opening reporte modal...')
      console.log('User permissions:', userPermissions.value)
      errorMessage.value = ''
      showReporteModal.value = true
    }

    const closeReporteModal = () => {
      showReporteModal.value = false
      errorMessage.value = ''
      // Reset form
      reporteForm.value = {
        area: '',
        espacio: '',
        equipo: '',
        observacion: ''
      }
    }

    const createReporte = async () => {
      console.log('Creating reporte with data:', reporteForm.value)
      submitting.value = true
      errorMessage.value = ''
      
      try {
        // Validar datos antes de enviar
        if (!reporteForm.value.equipo || !reporteForm.value.observacion.trim()) {
          throw new Error('Equipo y descripción del problema son requeridos')
        }

        // Preparar datos para enviar
        const reporteData = {
          equipo: parseInt(reporteForm.value.equipo),
          observacion: reporteForm.value.observacion.trim()
        }

        // Agregar área y espacio solo si están seleccionados
        if (reporteForm.value.area) {
          reporteData.area = parseInt(reporteForm.value.area)
        }
        if (reporteForm.value.espacio) {
          reporteData.espacio = parseInt(reporteForm.value.espacio)
        }

        console.log('Sending reporte data:', reporteData)

        let createdId = null
        let createdAt = new Date().toISOString()

        // Intentar crear el reporte
        try {
          const response = await apiCall('POST', '/api/reportes', reporteData)
          console.log('Reporte created successfully:', response)
          createdId = response?.id || response?.insertId || null
        } catch (apiError) {
          // Si el endpoint no existe, simular creación usando actividades
          console.warn('Endpoint /api/reportes no existe, creando actividad alternativa')
          
          const actividadData = {
            equipo_id: reporteData.equipo,
            tipo_actividad: 'reporte',
            descripcion: `Reporte: ${reporteData.observacion}`
          }
          const actResp = await apiCall('POST', '/api/actividades', actividadData)
          createdId = actResp?.id || actResp?.insertId || null
        }
        
        // Optimistic UI: añadir el reporte nuevo a la lista inmediatamente
        try {
          const equipoSel = equipos.value.find(e => e.id == reporteData.equipo)
          const nuevoReporte = {
            id: createdId || Math.floor(Math.random() * 1000000),
            fechahora: createdAt,
            usuario_nombre: user.value?.nombre || 'Tú',
            equipo_tipo: equipoSel?.tipo_equipo || null,
            equipo_modelo: equipoSel?.modelo || null,
            area_nombre: areas.value.find(a => a.id == reporteForm.value.area)?.nombre || null,
            observacion: reporteData.observacion,
            resuelto: false
          }
          reportes.value = [nuevoReporte, ...(reportes.value || [])]
        } catch (optimisticErr) {
          console.warn('No se pudo construir el reporte para UI inmediata:', optimisticErr?.message)
        }
        
        closeReporteModal()
        // Esperar breve tiempo antes de recargar para permitir consistencia en BD
        await new Promise(r => setTimeout(r, 300))
        // También recargar desde backend para asegurar sincronización
        await loadReportes()
        
        alert('Reporte creado exitosamente')
      } catch (error) {
        console.error('Error creating reporte:', error)
        errorMessage.value = 'Error al crear reporte: ' + (error.message || 'Error desconocido')
      } finally {
        submitting.value = false
      }
    }

    const resolveReporte = async (reporte) => {
      if (!confirm(`¿Estás seguro de marcar como resuelto el reporte #${reporte.id}?`)) return

      resolving.value = reporte.id
      try {
        console.log('Resolving reporte:', reporte.id)
        
        try {
          await apiCall('POST', `/api/reportes/${reporte.id}/resolver`)
        } catch (apiError) {
          // Alternativa: marcar como resuelto localmente
          console.warn('Endpoint resolver no existe, marcando localmente')
        }
        
        reporte.resuelto = true
        alert('Reporte resuelto exitosamente')
      } catch (error) {
        console.error('Error resolving reporte:', error)
        alert('Error al resolver reporte: ' + error.message)
      } finally {
        resolving.value = null
      }
    }

    // Enviar reporte a mantenimiento - NUEVO
    const sendToMantenimiento = async (reporte) => {
      if (!confirm(`¿Enviar el reporte #${reporte.id} a mantenimiento?`)) return
      resolving.value = reporte.id
      try {
        await apiCall('POST', `/api/reportes/${reporte.id}/enviar-a-mantenimiento`)
        reporte.resuelto = true
        alert('Reporte enviado a mantenimiento exitosamente')
      } catch (error) {
        const msg = error?.response?.data?.error || error.message
        alert('Error al enviar a mantenimiento: ' + msg)
      } finally {
        resolving.value = null
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Fecha no disponible'
      try {
        return new Date(dateString).toLocaleDateString('es-ES', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        })
      } catch (error) {
        return 'Fecha inválida'
      }
    }

    const debugPermissions = () => {
      console.log('=== DEBUG REPORTES PERMISSIONS ===')
      console.log('User:', user.value)
      console.log('User permissions:', userPermissions.value)
      console.log('Can create reportes:', userPermissions.value?.can_create_reportes)
      console.log('Can manage reportes:', userPermissions.value?.can_manage_reportes)
      alert(`Permisos reportes: ${JSON.stringify({
        can_create_reportes: userPermissions.value?.can_create_reportes,
        can_manage_reportes: userPermissions.value?.can_manage_reportes
      }, null, 2)}`)
    }

    onMounted(async () => {
      console.log('ReportesView mounted')
      console.log('Initial user permissions:', userPermissions.value)
      
      try {
        await Promise.all([loadReportes(), loadBaseData()])
        console.log('Initial reportes data loaded successfully')
      } catch (error) {
        console.error('Error during initial reportes load:', error)
      }
    })

    return {
      userPermissions,
      user,
      reportes,
      equipos,
      areas,
      espacios,
      showReporteModal,
      submitting,
      resolving,
      reporteForm,
      filteredEspacios,
      loading,
      errorMessage,
      isFormValid,
      openReporteModal,
      closeReporteModal,
      createReporte,
      resolveReporte,
      sendToMantenimiento,
      formatDate,
      debugPermissions,
      displayedAreas
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
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
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

.status-success {
  background-color: #dcfce7;
  color: #166534;
}

.status-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.icon-large {
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>