import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed (this is OK in some browsers):', error);
        // App will still work without service worker
      });
  });
}

// Add error boundary
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found');
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error('Failed to render app:', error);
    // Fallback: show error message
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Loading...</h1><p>If this persists, please open in a regular browser.</p></div>';
  }
}
