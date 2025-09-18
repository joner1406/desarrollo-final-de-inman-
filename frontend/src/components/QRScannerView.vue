<template>
  <div class="space-y-8">
    <div class="card-elevated p-8">
      <h3 class="text-2xl font-bold text-gray-900 mb-6 font-heading">Escáner QR</h3>

      <div v-if="!qrScanning && !equipoVinculado" class="text-center space-y-6">
        <div class="icon-large bg-gray-100 mx-auto">
          <i class="fas fa-qrcode text-6xl text-gray-400"></i>
        </div>
        <p class="text-gray-600 text-lg font-body">Escanea el código QR del equipo para vincularte</p>
        <button @click="startQRScanning" class="btn-primary">
          <i class="fas fa-camera mr-2"></i>Iniciar Escáner
        </button>
      </div>

      <div v-else-if="qrScanning" class="text-center space-y-6">
        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-12 rounded-xl border border-indigo-200">
          <i class="fas fa-spinner fa-spin text-5xl text-indigo-600 mb-6"></i>
          <p class="text-gray-700 text-xl font-body mb-2">Escaneando código QR...</p>
          <p class="text-gray-500 font-body">Apunta la cámara hacia el código QR del equipo</p>
        </div>
        <button @click="stopQRScanning" class="btn-danger">
          <i class="fas fa-stop mr-2"></i>Detener Escáner
        </button>
      </div>

      <!-- Sesión Activa -->
      <div v-if="equipoVinculado" class="mt-8 p-8 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
        <div class="flex items-center justify-center mb-6">
          <div class="icon-container bg-green-100">
            <i class="fas fa-check text-green-600 text-2xl"></i>
          </div>
        </div>
        <h4 class="text-2xl font-bold text-green-900 text-center mb-6 font-heading">¡Vinculación Exitosa!</h4>
        <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div class="flex justify-between items-center py-2">
            <span class="font-semibold text-gray-700 font-body">Equipo:</span>
            <span class="text-gray-900 font-body">{{ equipoVinculado.equipo_info?.tipo }} - {{ equipoVinculado.equipo_info?.modelo }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="font-semibold text-gray-700 font-body">Usuario:</span>
            <span class="text-gray-900 font-body">{{ currentUser?.nombre }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="font-semibold text-gray-700 font-body">Hora de vinculación:</span>
            <span class="text-gray-900 font-body">{{ formatDate(equipoVinculado.fecha_inicio) }}</span>
          </div>
        </div>
        <div class="text-center mt-6">
          <button @click="cerrarSesionEquipo" class="btn-danger">
            <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

export default {
  name: 'QRScannerView',
  setup() {
    const { currentUser } = useAuth()
    const { apiCall } = useApi()

    const qrScanning = ref(false)
    const equipoVinculado = ref(null)

    const startQRScanning = () => {
      qrScanning.value = true
      // Simulate QR scanning with timeout
      setTimeout(async () => {
        try {
          // In real implementation, this would come from QR scanner
          const simulatedQR = 'QR001HP001'
          await vincularEquipoQR(simulatedQR)
          qrScanning.value = false
        } catch (error) {
          console.error('QR Error:', error)
          qrScanning.value = false
          alert('Error en vinculación QR: ' + error.message)
        }
      }, 3000)
    }

    const stopQRScanning = () => {
      qrScanning.value = false
    }

    const vincularEquipoQR = async (codigoQR) => {
      try {
        const response = await apiCall('POST', '/api/sesiones/vincular_qr', {
          codigo_qr: codigoQR
        })
        equipoVinculado.value = response.sesion
      } catch (error) {
        throw error
      }
    }

    const cerrarSesionEquipo = async () => {
      if (!equipoVinculado.value) return

      try {
        // Simulate closing session
        equipoVinculado.value = null
        alert('Sesión cerrada exitosamente')
      } catch (error) {
        alert('Error al cerrar sesión: ' + error.message)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }

    return {
      currentUser,
      qrScanning,
      equipoVinculado,
      startQRScanning,
      stopQRScanning,
      cerrarSesionEquipo,
      formatDate
    }
  }
}
</script>
