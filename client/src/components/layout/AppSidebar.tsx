import { Fragment, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, CircleHelp, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setSidebarMobileOpen } from '../../features/ui/uiSlice';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { canAccessPath } from '../../config/routeAccess';
import { Logo } from '../ui/Logo';
import { getNavigationForRole, type NavItem } from './navigation';

const navIdle =
  'text-[rgba(255,255,255,0.82)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white';
const navActive = 'bg-white font-semibold text-[#9F1239]';

const SECTION_AFTER = new Set(['dashboard', 'leads', 'attendance']);

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const childActive = item.children?.some((c) => location.pathname.startsWith(c.href)) ?? false;
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (!item.children) {
    const linkIsDashboard = item.id === 'dashboard';

    return (
      <NavLink
        to={item.href!}
        end={!linkIsDashboard}
        className={({ isActive }) => {
          const active =
            isActive ||
            (linkIsDashboard && location.pathname.includes('/dashboard'));
          return cn(
            'group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] font-medium transition-all duration-200 ease-in-out',
            active ? navActive : navIdle,
            collapsed && 'justify-center px-2',
          );
        }}
        title={collapsed ? item.label : undefined}
      >
        {({ isActive }) => {
          const active =
            isActive ||
            (linkIsDashboard && location.pathname.includes('/dashboard'));
          return (
            <>
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-all duration-200 ease-in-out',
                  active
                    ? 'text-[#9F1239]'
                    : 'text-[rgba(255,255,255,0.75)] group-hover:text-white',
                )}
                aria-hidden
              />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge ? (
                <span
                  className={cn(
                    'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums',
                    active
                      ? 'bg-[#9F1239] text-white'
                      : 'bg-white/15 text-white',
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </>
          );
        }}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] font-medium transition-all duration-200 ease-in-out',
          childActive ? 'bg-[rgba(255,255,255,0.08)] text-white' : navIdle,
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-all duration-200 ease-in-out',
            childActive ? 'text-white' : 'text-[rgba(255,255,255,0.75)] group-hover:text-white',
          )}
          aria-hidden
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-all duration-200 ease-in-out',
                open || childActive
                  ? 'text-white'
                  : 'text-[rgba(255,255,255,0.65)] group-hover:text-white',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="relative mt-1 ml-4 space-y-0.5 border-l border-[rgba(255,255,255,0.10)] py-1 pl-3 animate-fade-in">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 ease-in-out',
                  isActive
                    ? navActive
                    : 'text-[rgba(255,255,255,0.68)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <child.icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-all duration-200 ease-in-out',
                      isActive
                        ? 'text-[#9F1239]'
                        : 'text-[rgba(255,255,255,0.68)] group-hover:text-white',
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{child.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useAppSelector((s) => s.ui);
  const { user } = useAuth();
  const location = useLocation();
  const roleNav = user ? getNavigationForRole(user.role) : [];
  const showSettingsHelp = user ? canAccessPath(user.role, '/settings') : false;

  useEffect(() => {
    dispatch(setSidebarMobileOpen(false));
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (!sidebarMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(setSidebarMobileOpen(false));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarMobileOpen, dispatch]);

  const collapsed = sidebarCollapsed && !sidebarMobileOpen;

  const sidebarContent = (
    <div className="relative flex h-full flex-col">
      <div
        className={cn(
          'flex h-[var(--header-height)] items-center gap-2 border-b border-[rgba(255,255,255,0.10)] px-3',
          !collapsed && 'px-3.5',
        )}
        style={{ background: '#720D21' }}
      >
        <Logo onBrand collapsed={collapsed} className="min-w-0 flex-1" />
        <button
          type="button"
          className="shrink-0 rounded-[10px] p-1.5 text-[rgba(255,255,255,0.75)] transition-all duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.08)] hover:text-white lg:hidden"
          aria-label="Close navigation"
          onClick={() => dispatch(setSidebarMobileOpen(false))}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav
        className="relative flex-1 space-y-1 overflow-y-auto px-2.5 py-4 scrollbar-thin"
        aria-label="Main navigation"
      >
        {!collapsed && (
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.68)]">
            Menu
          </p>
        )}
        {roleNav.map((item, index) => (
          <Fragment key={item.id}>
            <NavGroup item={item} collapsed={collapsed} />
            {SECTION_AFTER.has(item.id) && index < roleNav.length - 1 ? (
              <div
                className="mx-2 my-2 h-px bg-[rgba(255,255,255,0.10)]"
                role="separator"
              />
            ) : null}
          </Fragment>
        ))}
      </nav>

      {showSettingsHelp ? (
        <div className="border-t border-[rgba(255,255,255,0.10)] p-2.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] font-medium transition-all duration-200 ease-in-out',
                isActive
                  ? navActive
                  : 'bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.10)]',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? 'Help Center' : undefined}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]',
                    isActive ? 'bg-[#9F1239]/10' : 'bg-[rgba(255,255,255,0.10)]',
                  )}
                >
                  <CircleHelp
                    className={cn(
                      'h-4 w-4 transition-all duration-200 ease-in-out',
                      isActive ? 'text-[#9F1239]' : 'text-[rgba(255,255,255,0.75)] group-hover:text-white',
                    )}
                    aria-hidden
                  />
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate', isActive ? 'text-[#9F1239]' : 'text-white')}>
                      Help Center
                    </span>
                    <span
                      className={cn(
                        'block truncate text-[11px] font-normal',
                        isActive ? 'text-[#9F1239]/70' : 'text-[rgba(255,255,255,0.65)]',
                      )}
                    >
                      Guides & support
                    </span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>
      ) : null}
    </div>
  );

  const brandSidebar = 'border-r border-[rgba(255,255,255,0.10)]';
  const sidebarBg = { background: '#7F1026' } as const;

  return (
    <>
      {sidebarMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0F172A]/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => dispatch(setSidebarMobileOpen(false))}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden transition-all duration-300 lg:flex lg:flex-col',
          brandSidebar,
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
        )}
        style={sidebarBg}
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] transition-transform duration-300 lg:hidden',
          brandSidebar,
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={sidebarBg}
        aria-hidden={!sidebarMobileOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
