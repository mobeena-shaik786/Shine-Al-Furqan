import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppDispatch } from '../app/store';
import { setUnreadNotifications } from '../features/ui/uiSlice';
import {
  listMyInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotificationDto,
  type InboxNotificationType,
} from '../services/notificationsApi';

type StatusFilter = 'all' | 'unread' | 'read';

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function typeLabel(type: InboxNotificationType) {
  if (type === 'alert') return 'Alert';
  if (type === 'warning') return 'Warning';
  if (type === 'success') return 'Success';
  return 'Info';
}

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<'' | InboxNotificationType>('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [items, setItems] = useState<InboxNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listMyInbox({
        status,
        type: type || undefined,
        search: searchDebounced || undefined,
        limit: 100,
      });
      setItems(result.notifications);
      setUnreadCount(result.meta.unreadCount ?? 0);
      dispatch(setUnreadNotifications(result.meta.unreadCount ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [status, type, searchDebounced, dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle =
    unreadCount === 0
      ? 'All caught up — no unread notifications'
      : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`;

  const onOpenItem = async (item: InboxNotificationDto) => {
    setExpandedId((prev) => (prev === item._id ? null : item._id));
    if (item.read) return;
    try {
      await markNotificationRead(item._id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark as read');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E2531]">Notifications</h1>
        <p className="mt-1 text-sm text-[#758188]">{subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(['all', 'unread', 'read'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold capitalize transition',
                status === key
                  ? 'bg-[#B01828] text-[#F8F8F8]'
                  : 'border border-[#E4DFE5] bg-[#F8F8F8] text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]',
              )}
            >
              {key}
            </button>
          ))}
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                void markAllNotificationsRead()
                  .then(load)
                  .catch((e) =>
                    setError(e instanceof Error ? e.message : 'Unable to mark all as read'),
                  )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#E4DFE5] px-3 py-2 text-sm font-semibold text-[#1E2531] hover:bg-[#E9EEF0]"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
        <div className="flex flex-col gap-3 border-b border-[#E4DFE5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="text-sm font-bold text-[#1E2531]">Your inbox</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as '' | InboxNotificationType)}
              className="rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>

        <div className="min-h-[360px] p-4 sm:p-5">
          {error ? <p className="mb-3 text-sm text-[#E03040]">{error}</p> : null}
          {loading ? (
            <p className="py-16 text-center text-sm text-[#758188]">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Bell className="h-16 w-16 text-[#E4DFE5]" strokeWidth={1.25} aria-hidden />
              <p className="mt-4 text-base font-semibold text-[#758188]">No notifications</p>
              <p className="mt-1 text-sm text-[#758188]">
                {status === 'unread'
                  ? 'You have no unread notifications.'
                  : status === 'read'
                    ? 'You have no read notifications yet.'
                    : 'You have no notifications yet.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const open = expandedId === item._id;
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-xl border px-4 py-3 text-left transition hover:border-[#E03040]/30',
                        item.read
                          ? 'border-[#E4DFE5] bg-[#F8F8F8]'
                          : 'border-[#B01828]/25 bg-[#E03040]/5',
                      )}
                      onClick={() => void onOpenItem(item)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {!item.read ? (
                              <span className="h-2 w-2 rounded-full bg-[#B01828]" aria-hidden />
                            ) : null}
                            <p className="font-semibold text-[#1E2531]">{item.subject}</p>
                            <span className="rounded-full bg-[#E9EEF0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#758188]">
                              {typeLabel(item.type)}
                            </span>
                          </div>
                          <p
                            className={cn(
                              'mt-1 text-sm text-[#758188]',
                              open ? 'whitespace-pre-wrap' : 'line-clamp-2',
                            )}
                          >
                            {item.message}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-[#758188]">{formatWhen(item.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
