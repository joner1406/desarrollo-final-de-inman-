import { ref } from 'vue'
import axios from 'axios'

export const useApi = () => {
  const loading = ref(false)
  const error = ref(null)

  const apiCall = async (method, url, data = null) => {
    loading.value = true
    error.value = null

    try {
      const config = { method, url }
      if (data) config.data = data

      const response = await axios(config)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    apiCall
  }
}
