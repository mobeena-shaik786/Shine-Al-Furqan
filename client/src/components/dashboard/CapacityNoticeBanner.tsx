import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { CapacityNotice } from '../../types/dashboard';
import { formatNumber } from '../../lib/utils';

interface CapacityNoticeBannerProps {
  data?: CapacityNotice;
}

export function CapacityNoticeBanner({ data }: CapacityNoticeBannerProps) {
  if (!data) return null;

  return (
    <Link
      to="/batches"
      className="group flex items-center gap-3 rounded-2xl border border-[rgba(185,28,28,0.20)] bg-[#FFF7F7] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] dark:border-[rgba(248,113,113,0.25)] dark:bg-[#9F1239]/20 sm:gap-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B91C1C]/10 text-[#B91C1C] dark:bg-white/10 dark:text-red-300">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {formatNumber(data.availableSeats)} batch seats available ({data.utilizationPercent}%
          utilized)
        </p>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Review capacity and open seats across active batches.
        </p>
      </div>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-[#B91C1C] transition-transform duration-200 group-hover:translate-x-0.5 dark:text-red-300"
        aria-hidden
      />
    </Link>
  );
}
