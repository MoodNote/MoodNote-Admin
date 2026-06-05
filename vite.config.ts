import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
// Recharts imports these compat helpers as defaults, while the ESM files expose named exports.
const esToolkitCompat = (moduleName: string) => path.resolve(__dirname, `src/vendor/es-toolkit-compat/${moduleName}.js`)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'es-toolkit/compat/get': esToolkitCompat('get'),
      'es-toolkit/compat/isPlainObject': esToolkitCompat('isPlainObject'),
      'es-toolkit/compat/last': esToolkitCompat('last'),
      'es-toolkit/compat/maxBy': esToolkitCompat('maxBy'),
      'es-toolkit/compat/minBy': esToolkitCompat('minBy'),
      'es-toolkit/compat/omit': esToolkitCompat('omit'),
      'es-toolkit/compat/range': esToolkitCompat('range'),
      'es-toolkit/compat/sortBy': esToolkitCompat('sortBy'),
      'es-toolkit/compat/sumBy': esToolkitCompat('sumBy'),
      'es-toolkit/compat/throttle': esToolkitCompat('throttle'),
      'es-toolkit/compat/uniqBy': esToolkitCompat('uniqBy'),
    },
  },
})
