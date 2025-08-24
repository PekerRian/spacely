import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_TWITTER_BEARER_TOKEN': JSON.stringify(process.env.TWITTER_BEARER_TOKEN),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'aptos-vendor': ['@aptos-labs/wallet-adapter-react', 'petra-plugin-wallet-adapter', 'aptos']
        }
      }
    },
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@aptos-labs/wallet-adapter-react', 'petra-plugin-wallet-adapter', 'aptos']
  }
})
