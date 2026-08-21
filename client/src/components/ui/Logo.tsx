import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  collapsed?: boolean;
  /** Light text for dark brand backgrounds (sidebar) */
  onBrand?: boolean;
}

export function Logo({
  className,
  showText = true,
  collapsed = false,
  onBrand = false,
}: LogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.18)]',
          collapsed ? 'h-10 w-10 p-1' : 'h-12 w-12 p-1.5',
        )}
      >
        <img
          src="/logo-shine-al-furqan.png"
          alt="Shine Al Furqan"
          className="h-full w-full object-contain"
        />
      </div>

      {showText && !collapsed && (
        <div className="min-w-0 animate-fade-in">
          <p
            className={cn(
              'truncate font-arabic text-base font-bold leading-tight',
              onBrand ? 'text-white' : 'text-[#B91C1C]',
            )}
            dir="rtl"
            lang="ur"
          >
            شاین الفرقان
          </p>
          <p
            className={cn(
              'mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em]',
              onBrand ? 'text-[#D4AF37]' : 'text-[#D4AF37]',
            )}
          >
            Shine Al Furqan
          </p>
        </div>
      )}
    </div>
  );
}

export default Logo;
