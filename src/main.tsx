import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isInAppBrowser, getBrowserInfo } from "@/lib/browserDetection";

// Logging
console.log('=== NUDGELY STARTING ===');
console.log('Browser:', getBrowserInfo());
console.log('In-App Browser:', isInAppBrowser());
console.log('URL:', window.location.href);

// Function to render the app
const renderApp = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error('ROOT ELEMENT NOT FOUND!');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('=== APP RENDERED SUCCESSFULLY ===');
  } catch (error) {
    console.error('RENDER ERROR:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: red;">App Failed to Load</h1>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #00A6EA;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        ">
          Try Again
        </button>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          ${isInAppBrowser() ? `Tip: Try opening this link in ${getBrowserInfo() === 'Instagram Browser' ? 'Safari or Chrome' : 'your regular browser'}` : ''}
        </p>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED PROMISE REJECTION:', event.reason);
});

// Render the app
renderApp();
