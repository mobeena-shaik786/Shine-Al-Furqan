import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getGreeting } from '../../lib/utils';
import { UserAvatar } from '../ui/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { splitName } from '../../types/auth';

export function WelcomeBanner() {
  const { user } = useAuth();
  const { firstName, lastName } = splitName(user?.name ?? 'User');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="rounded-2xl px-5 py-4 sm:px-6 sm:py-5"
      style={{ background: '#720D21' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <UserAvatar
            firstName={firstName}
            lastName={lastName}
            size="lg"
            className="bg-white text-[#720D21]"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#D4AF37]">{getGreeting(now)}</p>
            <h2 className="mt-0.5 text-xl font-bold leading-tight text-white sm:text-2xl">
              Assalamu Alaikum, {user?.name}
            </h2>
            <p className="mt-1 text-[13px] text-white/70 sm:text-sm">
              Academy overview — live stats from your database.
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-[10px] border border-white/80 bg-white px-3 py-2 text-left font-semibold text-[#9F1239] sm:text-right">
          <p className="text-[14px] tabular-nums leading-tight">
            {format(now, 'hh:mm a')}
          </p>
          <p className="mt-0.5 text-[12px] font-medium leading-tight text-[#9F1239]/80">
            {format(now, 'EEE, MMM d, yyyy')}
          </p>
        </div>
      </div>
    </section>
  );
}
