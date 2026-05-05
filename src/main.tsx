import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/shared/ui-kit/Toaster'
import { DevModeSwitcher } from '@/components/DevModeSwitcher'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster>
        <App />
        <DevModeSwitcher />
      </Toaster>
    </BrowserRouter>
  </React.StrictMode>,
)
