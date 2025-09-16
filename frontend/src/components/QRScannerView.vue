<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Escáner QR</h3>

      <div v-if="!qrScanning && !equipoVinculado" class="text-center space-y-4">
        <div class="h-32 w-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
          <i class="fas fa-qrcode text-6xl text-gray-400"></i>
        </div>
        <p class="text-gray-600">Escanea el código QR del equipo para vincularte</p>
        <button @click="startQRScanning"
                class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          <i class="fas fa-camera mr-2"></i>Iniciar Escáner
        </button>
      </div>

      <div v-else-if="qrScanning" class="text-center space-y-4">
        <div class="bg-gray-100 p-8 rounded-lg">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">Escaneando código QR...</p>
          <p class="text-sm text-gray-500">Apunta la cámara hacia el código QR del equipo</p>
        </div>
        <button @click="stopQRScanning"
                class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          <i class="fas fa-stop mr-2"></i>Detener Escáner
        </button>
      </div>

      <!-- Sesión Activa -->
      <div v-if="equipoVinculado" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-center mb-4">
          <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check text-green-600 text-xl"></i>
          </div>
        </div>
        <h4 class="text-lg font-medium text-green-900 text-center mb-4">¡Vinculación Exitosa!</h4>
        <div class="bg-white p-4 rounded-lg space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">Equipo:</span>
            <span>{{ equipoVinculado.equipo_info?.tipo }} - {{ equipoVinculado.equipo_info?.modelo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Usuario:</span>
            <span>{{ currentUser?.nombre }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Hora de vinculación:</span>
            <span>{{ formatDate(equipoVinculado.fecha_inicio) }}</span>
          </div>
        </div>
        <div class="text-center mt-4">
          <button @click="cerrarSesionEquipo"
                  class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
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
