import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnvironment, logValidationResults } from './utils/validateEnv'

// Validate environment variables on startup
const envValidation = validateEnvironment();
logValidationResults(envValidation);

// If there are critical errors in production, show error message
if (!envValidation.isValid && envValidation.config.isProduction) {
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background-color: #f9fafb;">
      <div style="max-width: 600px; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
        <p style="color: #374151; margin-bottom: 20px;">The application is not properly configured. Please contact your administrator.</p>
        <details style="background: #f3f4f6; padding: 12px; border-radius: 4px;">
          <summary style="cursor: pointer; font-weight: bold;">Error Details</summary>
          <ul style="margin-top: 12px; color: #6b7280;">
            ${envValidation.errors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        </details>
      </div>
    </div>
  `;
  throw new Error('Environment validation failed');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
