import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { useAuth } from '../../context/AuthContext';
import { canAccessPath } from '../../config/routeAccess';
import { splitName } from '../../types/auth';
import {
  setSearchOpen,
  setSidebarMobileOpen,
  setUnreadNotifications,
  toggleSidebarCollapsed,
  toggleTheme,
} from '../../features/ui/uiSlice';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../ui/UserAvatar';
import { t } from '../../lib/i18n/en';
import { getUnreadNotificationCount } from '../../services/notificationsApi';

const iconBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-all duration-200 hover:bg-surface-muted hover:text-ink';

/** Real destinations only — no fake search results. */
const QUICK_LINKS = [
  { label: 'Courses', href: '/courses' },
  { label: 'Students', href: '/students' },
  { label: 'Batches', href: '/batches' },
  { label: 'Attendance', href: '/attendance' },
] as const;

export function AppHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { firstName, lastName } = splitName(user?.name ?? 'User');
  const canOpenSettings = user ? canAccessPath(user.role, '/settings') : false;
  const { theme, searchOpen, unreadNotifications } = useAppSelector((s) => s.ui);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setSearchOpen(true));
      }
      if (e.key === 'Escape') {
        dispatch(setSearchOpen(false));
        setMenuOpen(false);
        setAppsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      dispatch(setUnreadNotifications(0));
      return;
    }
    void getUnreadNotificationCount().then((count) => {
      dispatch(setUnreadNotifications(count));
    });
  }, [user, dispatch]);

  useEffect(() => {
    if (!searchOpen) return;
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        dispatch(setSearchOpen(false));
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [searchOpen, dispatch]);

  const goTo = useCallback(
    (href: string) => {
      navigate(href);
      dispatch(setSearchOpen(false));
    },
    [navigate, dispatch],
  );

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const visibleQuickLinks = QUICK_LINKS.filter((link) =>
    user ? canAccessPath(user.role, link.href) : false,
  );

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-3 border-b border-line bg-surface-card px-4 sm:gap-4 sm:px-6">
      <button
        type="button"
        className={cn(iconBtn, 'lg:hidden')}
        aria-label="Open navigation menu"
        onClick={() => dispatch(setSidebarMobileOpen(true))}
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        type="button"
        className={cn(iconBtn, 'hidden lg:inline-flex')}
        aria-label="Toggle sidebar"
        onClick={() => dispatch(toggleSidebarCollapsed())}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1" ref={searchRef}>
        <button
          type="button"
          className="flex h-11 w-full max-w-xl items-center gap-2.5 rounded-xl border border-line bg-surface-muted px-4 text-left text-sm text-ink-muted transition-all duration-200 hover:border-[#B91C1C]/25 hover:bg-surface-card"
          onClick={() => dispatch(setSearchOpen(true))}
          aria-label="Open quick navigation"
          aria-expanded={searchOpen}
        >
          <Search className="h-4 w-4 shrink-0 text-ink-muted" />
          <span className="truncate">{t.searchPlaceholder}</span>
        </button>

        {searchOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface-card p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] md:max-w-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Quick navigation</p>
              <button
                type="button"
                className="rounded-lg p-1 text-ink-muted transition-all duration-200 hover:bg-surface-muted hover:text-ink"
                aria-label="Close search"
                onClick={() => dispatch(setSearchOpen(false))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 rounded-xl bg-surface-muted px-3 py-2 text-xs text-ink-muted" role="status">
              Global search is not available yet. Use these real pages instead.
            </p>
            <ul className="space-y-1">
              {visibleQuickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => goTo(link.href)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#B91C1C] transition-all duration-200 hover:bg-surface-muted"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <div className="relative">
          <button
            type="button"
            className={iconBtn}
            aria-label="App shortcuts"
            aria-expanded={appsOpen}
            onClick={() => setAppsOpen((v) => !v)}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          {appsOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-line bg-surface-card p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
              {visibleQuickLinks.map((app) => (
                <button
                  key={app.href}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-all duration-200 hover:bg-surface-muted"
                  onClick={() => {
                    navigate(app.href);
                    setAppsOpen(false);
                  }}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={cn(iconBtn, 'relative')}
          aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#B91C1C]" />
          )}
        </button>

        <button
          type="button"
          className={iconBtn}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-all duration-200 hover:bg-surface-muted"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              size="sm"
              className="bg-[#B91C1C] text-white"
            />
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink sm:inline">
              {user?.name}
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 text-ink-muted transition-transform duration-200 sm:block',
                menuOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-surface-card shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink transition-all duration-200 hover:bg-surface-muted"
                onClick={() => {
                  navigate('/profile');
                  setMenuOpen(false);
                }}
              >
                <User className="h-4 w-4" /> Profile
              </button>
              {canOpenSettings ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink transition-all duration-200 hover:bg-surface-muted"
                  onClick={() => {
                    navigate('/settings');
                    setMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
              ) : null}
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-danger transition-all duration-200 hover:bg-surface-muted"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" /> {t.signOut}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
