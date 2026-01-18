import React from 'react';
import App from './App.tsx';
import './index.css';
import './i18n';
import ReactDOM from 'react-dom/client';

const Root = () => {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
