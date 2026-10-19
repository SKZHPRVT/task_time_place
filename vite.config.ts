import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/task_time_place/',
  build: {
    outDir: 'dist',
    sourcemap: true, // Включаем сорсмапы, чтобы видеть реальные ошибки в консоли
  }
})
