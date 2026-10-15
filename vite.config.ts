import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The aliases are Student 2.0's, so an import written here keeps working after
// `src/modules/Calendar` is copied across.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: { port: 5180, open: true },
})
