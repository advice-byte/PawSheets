// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Login from './components/Auth.jsx'; // your login/auth component
import Dashboard from './components/EnhancedSpreadsheet.jsx'; // example main page

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add more routes here as needed */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
