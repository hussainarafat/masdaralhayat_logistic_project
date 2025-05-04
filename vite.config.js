import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// --- UnoCSS Imports ---
// Make sure you have installed these packages:
// npm install -D unocss @unocss/preset-uno @unocss/preset-attributify @unocss/preset-icons
import UnoCSS from 'unocss/vite'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // --- Add UnoCSS plugin here ---
    UnoCSS({
      presets: [
        presetUno(), // Enable Tailwind-like utilities
        presetAttributify(), // Enable attributify mode (optional)
        presetIcons({ // Enable icons (optional)
          scale: 1.2,
          warn: true,
        }),
      ],
      // You can add custom rules or shortcuts here later if needed
      // Example:
      // shortcuts: [
      //   [/^btn-(.*)$/, ([,c]) => `bg-${c}-400 text-${c}-100 py-2 px-4 rounded-lg`],
      // ],
    }),

    // --- Keep the existing React plugin ---
    react(),
  ],
})