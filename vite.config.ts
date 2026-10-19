import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Жестко указываем имя репозитория для GitHub Pages
  base: '/task_time_place/', 
})
