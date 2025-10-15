// Redirect in-app browsers to compatibility page
if (typeof navigator !== 'undefined') {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('instagram') || ua.includes('telegram') || ua.includes('fban') || ua.includes('fbav')) {
    window.location.href = '/incompatible.html';
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
