import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // `@/x` → `src/x` (root-relative, matches the tsconfig `paths`).
  resolve: { alias: [{ find: /^@\//, replacement: '/src/' }] },
  server: { port: 5189, strictPort: false },
})
