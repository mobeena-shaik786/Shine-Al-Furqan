import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { t } from '../lib/i18n/en';

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: title }]}
      />
      <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Construction className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-ink">{t.comingSoon}</h2>
        <p className="mt-2 max-w-md text-sm text-ink-muted">{t.comingSoonDesc}</p>
        <p className="mt-4 rounded-xl bg-warm/30 px-4 py-2 text-xs font-medium text-primary">
          This feature is not available yet. Navigation is reserved so it can ship without pretending
          to work.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
