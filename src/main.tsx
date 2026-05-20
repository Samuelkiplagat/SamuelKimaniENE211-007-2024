import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppServicesProvider } from './context/AppServicesContext';
import { SettingsProvider } from './context/SettingsContext';
import App from './App';
import './styles/index.css';
import './styles/pdf-text-layer.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppServicesProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AppServicesProvider>
  </StrictMode>,
);
