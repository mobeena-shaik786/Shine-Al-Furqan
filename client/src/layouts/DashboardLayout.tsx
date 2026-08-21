import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/store';
import { cn } from '../lib/utils';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export function DashboardLayout() {
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-xl bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <div
        className={cn(
          'flex min-h-[100dvh] flex-col bg-surface-page transition-all duration-300',
          sidebarCollapsed
            ? 'lg:pl-[var(--sidebar-collapsed-width)]'
            : 'lg:pl-[var(--sidebar-width)]',
        )}
      >
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-x-hidden bg-surface-page p-4 sm:p-5 lg:p-6" tabIndex={-1}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
