import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// --- UnoCSS Imports ---
import UnoCSS from 'unocss/vite'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // --- UnoCSS plugin ---
    UnoCSS({
      presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
          scale: 1.2,
          warn: true,
        }),
      ],
      // shortcuts: [ /* ... your shortcuts if any ... */ ],
    }),

    // --- React plugin ---
    react(),
  ],

  // +++ ADD THIS SECTION FOR GITHUB PAGES +++
  base: '/masdaralhayat_logistic_project/'
  // ++++++++++++++++++++++++++++++++++++++++++

})