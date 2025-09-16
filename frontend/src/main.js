import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import axios from 'axios'

// Configure axios para conexión directa
axios.defaults.baseURL = 'http://localhost:3001'
axios.defaults.withCredentials = true

const app = createApp(App)
app.mount('#app')
