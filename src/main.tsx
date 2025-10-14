import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error('Render error:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: red;">Error Loading App</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="location.reload()" style="
          padding: 10px 20px; 
          background: #00A6EA; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          margin-top: 20px;
        ">
          Reload
        </button>
      </div>
    `;
  }
}
