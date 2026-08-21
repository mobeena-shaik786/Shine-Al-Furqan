import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex flex-wrap items-center gap-1 text-xs text-[#758188]"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="inline-flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-[#E03040]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#758188]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[#E03040]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#758188]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
