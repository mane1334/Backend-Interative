import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow JSX syntax in .js files as well (during transform)
  esbuild: {
    loader: 'jsx',
    jsx: 'automatic',
    include: /src\/.*\.[jt]sx?$/,
  },
  // Ensure dependency scanner (optimizeDeps) parses .js as JSX too
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  preview: {
    port: 3001,
    host: true,
  },
})
