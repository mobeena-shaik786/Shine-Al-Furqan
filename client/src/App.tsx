import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { setTheme } from './features/ui/uiSlice';

function ThemeBootstrap() {
  useEffect(() => {
    const theme = (localStorage.getItem('saf_theme') as 'light' | 'dark' | null) ?? 'light';
    store.dispatch(setTheme(theme));
  }, []);
  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <ThemeBootstrap />
            <AppRouter />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </Provider>
  );
}
