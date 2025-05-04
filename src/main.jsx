// --- UnoCSS Import ---
// Add this line at the very top
import 'virtual:uno.css'

// --- Keep your existing imports ---
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Keep your custom CSS import if needed
import App from './App.jsx'

// --- Keep the rendering logic ---
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)