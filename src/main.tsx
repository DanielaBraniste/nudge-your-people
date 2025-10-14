import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('Starting app...');

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('No root element!');
} else {
  try {
    createRoot(rootElement).render(<App />);
    console.log('App rendered!');
  } catch (error) {
    console.error('Error:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Error Loading App</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #00A6EA; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Reload
        </button>
      </div>
    `;
  }
}
