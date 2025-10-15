// Detect problematic in-app browsers and conditionally register service worker
function isProblematicBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('instagram') || 
         userAgent.includes('fb') || 
         userAgent.includes('facebook');
}

// Only register service worker if not in a problematic browser
if ('serviceWorker' in navigator && !isProblematicBrowser()) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      // In production, the inline script from VitePWA will handle registration
    }
  });
} else if (isProblematicBrowser()) {
  console.log('In-app browser detected - service worker disabled for compatibility');
}

// Your existing imports below
import React from "react";
import ReactDOM from "react-dom/client";
// ... rest of your imports
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);
      },
      (error) => {
        console.log('ServiceWorker registration failed:', error);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
