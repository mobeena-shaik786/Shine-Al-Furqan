import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  IndianRupee,
  Info,
  Send,
  Shield,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FieldShell, formControlClass } from '../../components/ui/FormField';
import { cn } from '../../lib/utils';
import {
  getSettings,
  listNotificationHistory,
  sendNotification,
  updateSettings,
  type AppNotificationDto,
  type NotificationAudience,
  type NotificationType,
  type SystemSettingsDto,
} from '../../services/settingsApi';

type MainTab = 'notifications' | 'salary' | 'live' | 'approvals' | 'audit';
type NotifySub = 'send' | 'history';

const AUDIENCE_OPTIONS: Array<{
  id: NotificationAudience;
  label: string;
  icon: typeof Users;
}> = [
  { id: 'all', label: 'All users', icon: Users },
  { id: 'admin', label: 'Admins', icon: Shield },
  { id: 'coordinator', label: 'Coordinators', icon: Users },
  { id: 'student', label: 'Students', icon: GraduationCap },
  { id: 'ustad', label: 'Ustads', icon: UserRound },
];

const TYPE_OPTIONS: Array<{
  id: NotificationType;
  label: string;
  icon: typeof Info;
  active: string;
}> = [
  { id: 'info', label: 'Info', icon: Info, active: 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#1E2531]' },
  {
    id: 'success',
    label: 'Success',
    icon: CheckCircle2,
    active: 'border-[#61E092] bg-[#61E092]/15 text-[#1E2531]',
  },
  {
    id: 'warning',
    label: 'Warning',
    icon: AlertTriangle,
    active: 'border-[#B77E5E] bg-[#B77E5E]/15 text-[#1E2531]',
  },
  {
    id: 'alert',
    label: 'Alert',
    icon: AlertTriangle,
    active: 'border-[#E03040] bg-[#E03040]/10 text-[#E03040]',
  },
];

export function SystemSettingsPage() {
  const [tab, setTab] = useState<MainTab>('notifications');
  const [notifySub, setNotifySub] = useState<NotifySub>('send');
  const [settings, setSettings] = useState<SystemSettingsDto | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState('');

  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [type, setType] = useState<NotificationType>('info');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<AppNotificationDto[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [basePay, setBasePay] = useState('2000');
  const [incentiveRate, setIncentiveRate] = useState('150');
  const [defaultMode, setDefaultMode] = useState<'unique' | 'fixed'>('unique');
  const [jitsiEnabled, setJitsiEnabled] = useState(true);
  const [jitsiDomain, setJitsiDomain] = useState('meet.jit.si');
  const [roomPrefix, setRoomPrefix] = useState('shine-al-furqan');

  const loadSettings = useCallback(async () => {
    setSettingsError('');
    try {
      const data = await getSettings();
      setSettings(data);
      setBasePay(String(data.salary.basePay));
      setIncentiveRate(String(data.salary.incentiveRate));
      setDefaultMode(data.salary.defaultMode);
      setJitsiEnabled(data.liveClass.enabled);
      setJitsiDomain(data.liveClass.jitsiDomain);
      setRoomPrefix(data.liveClass.roomPrefix);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Unable to load settings');
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const result = await listNotificationHistory({ page: 1, limit: 50 });
      setHistory(result.notifications);
      setHistoryTotal(result.meta.total);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unable to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void loadHistory();
  }, [loadSettings, loadHistory]);

  useEffect(() => {
    if (tab === 'notifications' && notifySub === 'history') {
      void loadHistory();
    }
  }, [tab, notifySub, loadHistory]);

  const onSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setSendError('Subject and message are required');
      return;
    }
    setSending(true);
    setSendError('');
    setSendSuccess('');
    try {
      await sendNotification({
        audience,
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSendSuccess('Notification sent');
      setSubject('');
      setMessage('');
      setHistoryTotal((n) => n + 1);
      if (notifySub === 'history') await loadHistory();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const onSaveSalary = async () => {
    const base = Number(basePay);
    const rate = Number(incentiveRate);
    if (!Number.isFinite(base) || base < 0 || !Number.isFinite(rate) || rate < 0) {
      setSettingsError('Enter valid salary amounts');
      return;
    }
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved('');
    try {
      const data = await updateSettings({
        salary: { basePay: base, incentiveRate: rate, defaultMode },
      });
      setSettings(data);
      setSettingsSaved('Salary rules saved');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setSettingsSaving(false);
    }
  };

  const onSaveLive = async () => {
    if (!jitsiDomain.trim() || !roomPrefix.trim()) {
      setSettingsError('Jitsi domain and room prefix are required');
      return;
    }
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved('');
    try {
      const data = await updateSettings({
        liveClass: {
          enabled: jitsiEnabled,
          jitsiDomain: jitsiDomain.trim(),
          roomPrefix: roomPrefix.trim(),
        },
      });
      setSettings(data);
      setSettingsSaved('Live class settings saved');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="System Settings"
        description="Manage approvals, notifications, salary rules, live class (Jitsi), and audit logs."
      />

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={tab === 'notifications'}
          onClick={() => setTab('notifications')}
          icon={Bell}
          label="Notifications"
        />
        <TabButton
          active={tab === 'salary'}
          onClick={() => setTab('salary')}
          icon={IndianRupee}
          label="Salary"
        />
        <TabButton
          active={tab === 'live'}
          onClick={() => setTab('live')}
          icon={Video}
          label="Live class"
        />
        <TabButton
          active={tab === 'approvals'}
          onClick={() => setTab('approvals')}
          icon={Shield}
          label="Approvals"
          soon
        />
        <TabButton
          active={tab === 'audit'}
          onClick={() => setTab('audit')}
          icon={FileText}
          label="Audit logs"
          soon
        />
      </div>

      {settingsError && tab !== 'notifications' ? (
        <p className="text-sm text-[#E03040]">{settingsError}</p>
      ) : null}
      {settingsSaved ? <p className="text-sm font-medium text-[#61E092]">{settingsSaved}</p> : null}

      {tab === 'notifications' ? (
        <div className="space-y-4">
          <div className="inline-flex rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-1">
            <button
              type="button"
              onClick={() => setNotifySub('send')}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                notifySub === 'send'
                  ? 'bg-[#B01828] text-[#F8F8F8]'
                  : 'text-[#758188] hover:text-[#1E2531]',
              )}
            >
              <Send className="h-4 w-4" />
              Send notification
            </button>
            <button
              type="button"
              onClick={() => setNotifySub('history')}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                notifySub === 'history'
                  ? 'bg-[#B01828] text-[#F8F8F8]'
                  : 'text-[#758188] hover:text-[#1E2531]',
              )}
            >
              <Clock3 className="h-4 w-4" />
              History ({historyTotal || history.length})
            </button>
          </div>

          {notifySub === 'send' ? (
            <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-5 shadow-soft sm:p-6">
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                    Recipients
                  </p>
                  <p className="mb-2 text-sm font-medium text-[#758188]">
                    Send to <span className="text-[#E03040]">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = audience === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAudience(opt.id)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                            active
                              ? 'border-[#B01828] bg-[#B01828] text-[#F8F8F8]'
                              : 'border-[#E4DFE5] bg-[#F8F8F8] text-[#1E2531] hover:border-[#E03040]/40',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                    Notification type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = type === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setType(opt.id)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                            active
                              ? opt.active
                              : 'border-[#E4DFE5] bg-[#F8F8F8] text-[#1E2531] hover:border-[#E03040]/40',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                    Message
                  </p>
                  <div className="space-y-4">
                    <FieldShell label="Subject" required>
                      {({ id }) => (
                        <input
                          id={id}
                          className={formControlClass}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Enter notification title"
                        />
                      )}
                    </FieldShell>
                    <FieldShell label="Message" required>
                      {({ id }) => (
                        <textarea
                          id={id}
                          rows={5}
                          className={formControlClass}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter your message here..."
                        />
                      )}
                    </FieldShell>
                  </div>
                </div>

                {sendError ? <p className="text-sm text-[#E03040]">{sendError}</p> : null}
                {sendSuccess ? <p className="text-sm font-medium text-[#61E092]">{sendSuccess}</p> : null}

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void onSend()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send notification'}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-5 shadow-soft">
              {historyLoading ? (
                <p className="text-sm text-[#758188]">Loading history…</p>
              ) : historyError ? (
                <p className="text-sm text-[#E03040]">{historyError}</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-[#758188]">No notifications sent yet.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((item) => (
                    <li
                      key={item._id}
                      className="rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#1E2531]">{item.subject}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-[#758188]">{item.message}</p>
                        </div>
                        <span className="rounded-full bg-[#E9EEF0] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#1E2531]">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#758188]">
                        To {item.audience === 'all' ? 'all users' : `${item.audience}s`} ·{' '}
                        {item.recipientCount} recipients ·{' '}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      ) : null}

      {tab === 'salary' ? (
        <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-5 shadow-soft sm:p-6">
          <h2 className="text-base font-bold text-[#1E2531]">Salary rules</h2>
          <p className="mt-1 text-sm text-[#758188]">
            These values drive Salary Management calculations for ustads.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FieldShell label="Base pay (₹)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  className={formControlClass}
                  value={basePay}
                  onChange={(e) => setBasePay(e.target.value)}
                />
              )}
            </FieldShell>
            <FieldShell label="Incentive rate (₹ per ratio point)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  className={formControlClass}
                  value={incentiveRate}
                  onChange={(e) => setIncentiveRate(e.target.value)}
                />
              )}
            </FieldShell>
            <FieldShell label="Default day mode">
              {({ id }) => (
                <select
                  id={id}
                  className={formControlClass}
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as 'unique' | 'fixed')}
                >
                  <option value="unique">Unique attendance days</option>
                  <option value="fixed">Fixed calendar days</option>
                </select>
              )}
            </FieldShell>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={settingsSaving}
              onClick={() => void onSaveSalary()}
              className="rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
            >
              {settingsSaving ? 'Saving…' : 'Save salary rules'}
            </button>
          </div>
          {settings ? (
            <p className="mt-3 text-xs text-[#758188]">
              Last updated {new Date(settings.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === 'live' ? (
        <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-5 shadow-soft sm:p-6">
          <h2 className="text-base font-bold text-[#1E2531]">Live class (Jitsi)</h2>
          <p className="mt-1 text-sm text-[#758188]">
            Configure the Jitsi domain used for live classroom links.
          </p>
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm font-medium text-[#1E2531]">
              <input
                type="checkbox"
                checked={jitsiEnabled}
                onChange={(e) => setJitsiEnabled(e.target.checked)}
              />
              Enable live class links
            </label>
            <FieldShell label="Jitsi domain">
              {({ id }) => (
                <input
                  id={id}
                  className={formControlClass}
                  value={jitsiDomain}
                  onChange={(e) => setJitsiDomain(e.target.value)}
                  placeholder="meet.jit.si"
                />
              )}
            </FieldShell>
            <FieldShell label="Room prefix" hint="Letters, numbers, and hyphens only">
              {({ id }) => (
                <input
                  id={id}
                  className={formControlClass}
                  value={roomPrefix}
                  onChange={(e) => setRoomPrefix(e.target.value)}
                  placeholder="shine-al-furqan"
                />
              )}
            </FieldShell>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={settingsSaving}
              onClick={() => void onSaveLive()}
              className="rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
            >
              {settingsSaving ? 'Saving…' : 'Save live class settings'}
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'approvals' || tab === 'audit' ? (
        <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-[#1E2531]">
            {tab === 'approvals' ? 'Approvals' : 'Audit logs'}
          </p>
          <p className="mt-2 text-sm text-[#758188]">
            This section is coming soon. Use Notifications, Salary, and Live class settings for now.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  soon,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Bell;
  label: string;
  soon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
        active
          ? 'bg-[#B01828] text-[#F8F8F8]'
          : 'border border-[#E4DFE5] bg-[#F8F8F8] text-[#758188] hover:text-[#1E2531]',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {soon ? (
        <span className="rounded-md bg-[#B77E5E]/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B77E5E]">
          Soon
        </span>
      ) : null}
    </button>
  );
}

export default SystemSettingsPage;
