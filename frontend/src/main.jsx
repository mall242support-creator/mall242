import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { CartProvider } from './context/CartContext';
import './styles/index.css';
import { LanguageProvider } from './context/LanguageContext';
import HelmetErrorBoundary from './components/common/HelmetErrorBoundary';

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Render app with all providers
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
       <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
          <HelmetErrorBoundary>
            <App />
            </HelmetErrorBoundary>
          </BrowserRouter>
        </CartProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);