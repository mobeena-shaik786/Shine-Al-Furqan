import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** When true, Escape / overlay click do nothing */
  busy?: boolean;
  className?: string;
  size?: 'md' | 'lg';
  /** Centered dialog (default) or right-side panel */
  variant?: 'dialog' | 'drawer';
  /** Optional content under the title (e.g. tabs) */
  headerExtra?: ReactNode;
  /** Hide the built-in title row when the child renders its own header */
  hideHeader?: boolean;
}

/**
 * Accessible dialog: focus trap, Escape, restores focus, labelled title.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  busy = false,
  className,
  size = 'md',
  variant = 'dialog',
  headerExtra,
  hideHeader = false,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = [...focusables()];
      if (nodes.length === 0) return;
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const onOverlay = (e: ReactMouseEvent) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  const isDrawer = variant === 'drawer';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-[#1E2531]/45',
        isDrawer ? 'flex justify-end' : 'flex items-end justify-center p-0 sm:items-center sm:p-4',
      )}
      onMouseDown={onOverlay}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'flex max-h-[100dvh] w-full flex-col overflow-hidden bg-[#F8F8F8] shadow-lift',
          isDrawer
            ? cn(
                'h-full animate-slide-in-right',
                size === 'lg' ? 'max-w-xl sm:max-w-xl' : 'max-w-md sm:max-w-lg',
              )
            : cn(
                'max-h-[92vh] overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl',
                size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md',
              ),
          className,
        )}
      >
        {!hideHeader ? (
          <div
            className={cn(
              'shrink-0',
              isDrawer ? 'border-b border-[#E4DFE5] px-5 pb-0 pt-5' : 'mb-4',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-bold text-[#1E2531]">
                {title}
              </h2>
              <button
                type="button"
                className="rounded-xl p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                aria-label="Close dialog"
                disabled={busy}
                onClick={onClose}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {headerExtra}
          </div>
        ) : (
          <span id={titleId} className="sr-only">
            {title}
          </span>
        )}
        <div className={cn(isDrawer ? 'flex min-h-0 flex-1 flex-col' : undefined)}>{children}</div>
      </div>
    </div>
  );
}
