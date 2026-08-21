import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getQuickActionsForRole } from '../layout/navigation';

export function QuickActions() {
  const { user } = useAuth();
  const actions = user ? getQuickActionsForRole(user.role) : [];

  if (actions.length === 0) return null;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.href}
          to={action.href}
          className="dash-lift card group flex items-start gap-3 p-3.5 sm:flex-col sm:items-start"
        >
          <span className="dash-icon">
            <action.icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{action.label}</span>
            {action.description ? (
              <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
                {action.description}
              </span>
            ) : null}
          </span>
        </Link>
      ))}
    </section>
  );
}
