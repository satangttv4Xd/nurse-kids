import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // Tailwind ใช้เฉพาะหน้า Dashboard (src/dashboard/dashboard.css) — ไม่กระทบ CSS ของเกม
    tailwindcss(),
    // /admin → หน้า Dashboard (ตอนพัฒนาในเครื่อง)
    {
      name: 'admin-route',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/admin' || req.url === '/admin/') req.url = '/dashboard.html'
          next()
        })
      },
    },
  ],
  server: {
    // ส่งต่อ /api ไปที่เซิร์ฟเวอร์ Express (npm run server)
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    rollupOptions: {
      input: {
        game: resolve(import.meta.dirname, 'index.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
      },
    },
  },
})
