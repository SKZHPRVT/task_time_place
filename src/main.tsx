import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTelegram } from './lib/telegram';

// 🧹 Очищаем старые битые ключи от предыдущих версий
try {
  const oldKeys = ['clear_tasks', 'clear_base_color', 'clear_first_launch', 'clear_app_state_v1', 'clear_app_state_v1_backup'];
  oldKeys.forEach(k => localStorage.removeItem(k));
} catch (e) {
  console.warn('[Cleanup] failed:', e);
}

initTelegram();

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace', fontSize: 14, background: '#000', minHeight: '100vh' }}>
          <h1>Ошибка приложения</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', marginTop: 20 }}>{this.state.error.stack}</pre>
          <button
            onClick={() => { localStorage.clear(); location.reload(); }}
            style={{ marginTop: 20, padding: 10, background: 'red', color: 'white', border: 'none' }}
          >
            Очистить хранилище и перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
