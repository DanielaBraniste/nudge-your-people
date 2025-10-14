import { createRoot } from "react-dom/client";
// Temporarily remove index.css import
// import "./index.css";

// Simple inline function to show messages
const showMessage = (message: string, isError = false) => {
  const debug = document.getElementById('debug');
  if (debug) {
    const div = document.createElement('div');
    div.className = 'status' + (isError ? ' error' : ' success');
    div.textContent = message;
    debug.appendChild(div);
  }
};

showMessage('📦 Main.tsx executing...');

const App = () => {
  showMessage('🎨 App component called');
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'sans-serif',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <h1 style={{ color: '#00A6EA', fontSize: '2rem', marginBottom: '1rem' }}>
        ✅ Nudgely Works!
      </h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>
        React is rendering successfully in {navigator.userAgent.includes('Instagram') ? 'Instagram' : 
                                           navigator.userAgent.includes('FBAN') ? 'Facebook' : 
                                           navigator.userAgent.includes('Telegram') ? 'Telegram' : 'your browser'}!
      </p>
    </div>
  );
};

try {
  showMessage('🔍 Looking for root element...');
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    showMessage('❌ Root element not found!', true);
    throw new Error('Root element not found');
  }
  
  showMessage('✅ Root element found');
  showMessage('🏗️ Creating React root...');
  
  const root = createRoot(rootElement);
  
  showMessage('✅ React root created');
  showMessage('🎨 Rendering App component...');
  
  root.render(<App />);
  
  showMessage('✅ Render called successfully');
  
  // Check if it actually rendered after a delay
  setTimeout(() => {
    if (rootElement.innerHTML.trim()) {
      showMessage('✅ Content is in DOM!', false);
      // Hide debug after success
      setTimeout(() => {
        const debug = document.getElementById('debug');
        if (debug) debug.style.display = 'none';
      }, 2000);
    } else {
      showMessage('❌ DOM is still empty after render', true);
    }
  }, 500);
  
} catch (error) {
  showMessage('❌ ERROR: ' + (error instanceof Error ? error.message : String(error)), true);
  showMessage('Stack: ' + (error instanceof Error ? error.stack : 'No stack'), true);
  
  // Show error on page too
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: red;">Error Loading App</h1>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="location.reload()" style="
          padding: 10px 20px; 
          margin-top: 20px; 
          background: #00A6EA; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 16px;
        ">
          Reload Page
        </button>
      </div>
    `;
  }
}
