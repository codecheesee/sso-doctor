import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled locally so the page makes no third-party requests
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
