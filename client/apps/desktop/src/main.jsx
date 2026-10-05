import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApiQueryProvider } from '@repo/api';
import { Toaster } from '@repo/ui';
import '@repo/ui/globals.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApiQueryProvider>
      <App />
      <Toaster />
    </ApiQueryProvider>
  </React.StrictMode>
);
