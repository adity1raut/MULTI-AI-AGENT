import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "./index.css"

ReactDOM.createRoot(document.getElementById('root')).render(
  // Remove StrictMode in development if it's causing issues
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);