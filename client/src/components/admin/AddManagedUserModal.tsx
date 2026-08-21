import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, Eye, EyeOff, Pencil, User } from 'lucide-react';
import type { AddUserCorePayload } from '../../services/usersApi';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { FieldShell, formControlClass } from '../ui/FormField';

interface AddManagedUserModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (payload: AddUserCorePayload) => Promise<void>;
  /** `admin` | `profile` | `ustad` | `student` */
  layout?: 'admin' | 'profile' | 'ustad' | 'student';
  emailPlaceholder?: string;
}

type TabId = 'details' | 'permissions';
type Gender = '' | 'male' | 'female' | 'other' | 'prefer_not';

const LANGUAGE_OPTIONS = ['English', 'Urdu', 'Hindi', 'Tamil'] as const;
const SPECIALIZATION_OPTIONS = [
  'Quran',
  'Tajweed',
  'Arabic',
  'Islamic Studies',
  'Hadith',
  'Fiqh',
] as const;

function passwordOk(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

function generatePassword(length = 12) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const specials = '@#$%';
  const all = letters + numbers + specials;
  let out = letters[Math.floor(Math.random() * letters.length)];
  out += numbers[Math.floor(Math.random() * numbers.length)];
  for (let i = 2; i < length; i += 1) {
    out += all[Math.floor(Math.random() * all.length)];
  }
  return out
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ageFromDob(iso: string): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return '';
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  if (!birthYear || !birthMonth || !birthDay) return '';

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const month = today.getMonth() + 1;
  const day = today.getDate();
  if (month < birthMonth || (month === birthMonth && day < birthDay)) {
    age -= 1;
  }
  if (age < 0 || age > 130) return '';
  return String(age);
}

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1);

const inputSoft = cn(formControlClass, 'bg-[#EEF2F5]');

export function AddManagedUserModal({
  open,
  title,
  submitLabel,
  onClose,
  onSubmit,
  layout = 'admin',
  emailPlaceholder = 'admin@example.com',
}: AddManagedUserModalProps) {
  const isProfile = layout === 'profile' || layout === 'ustad' || layout === 'student';
  const isUstad = layout === 'ustad';
  const isStudent = layout === 'student';
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabId>('details');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileCode, setMobileCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [altCode, setAltCode] = useState('+91');
  const [altNumber, setAltNumber] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(todayIsoDate());
  const [languages, setLanguages] = useState<string[]>([]);
  const [qualification, setQualification] = useState('');
  const [shiftTiming, setShiftTiming] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [parentName, setParentName] = useState('');
  const [parentCode, setParentCode] = useState('+91');
  const [parentNumber, setParentNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('details');
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setMobileCode('+91');
    setMobile('');
    setAltCode('+91');
    setAltNumber('');
    setGender('');
    setDateOfBirth('');
    setAge('');
    setWorkLocation('');
    setDateOfJoining(todayIsoDate());
    setLanguages([]);
    setQualification('');
    setShiftTiming('');
    setSpecializations([]);
    setParentName('');
    setParentCode('+91');
    setParentNumber('');
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!dateOfBirth) return;
    const fromDob = ageFromDob(dateOfBirth);
    if (fromDob !== '') {
      setAge(fromDob);
      setErrors((prev) => {
        if (!prev.age) return prev;
        const next = { ...prev };
        delete next.age;
        return next;
      });
    }
  }, [dateOfBirth]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email';
    if (!password.trim()) next.password = 'Password is required';
    else if (!passwordOk(password.trim())) {
      next.password = 'Password must be at least 8 characters and include a letter and number';
    }
    if (!mobile.trim()) next.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(mobile.trim())) next.mobile = 'Enter a 10-digit mobile number';

    if (isStudent) {
      if (!age) next.age = 'Select age';
    }
    if (isProfile) {
      if (!gender) next.gender = 'Gender is required';
      if (!isStudent && !dateOfJoining) next.dateOfJoining = 'Date of joining is required';
      if (languages.length === 0) next.languages = 'Select at least one language';
    }
    if (isUstad) {
      if (!qualification.trim()) next.qualification = 'Qualification is required';
      if (!shiftTiming.trim()) next.shiftTiming = 'Shift timing is required';
      if (specializations.length === 0) next.specializations = 'Select at least one specialization';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateDetails()) return;
    setFormError('');
    setTab('permissions');
  };

  const handleCreate = async () => {
    if (!validateDetails()) {
      if (!isProfile) setTab('details');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        ...(isProfile && gender ? { gender } : {}),
        ...(isProfile && languages.length ? { languages } : {}),
        ...(mobile.trim()
          ? { phone: `${mobileCode} ${mobile.trim()}`.replace(/\s+/g, ' ').trim() }
          : {}),
        ...(altNumber.trim()
          ? { alternatePhone: `${altCode} ${altNumber.trim()}`.replace(/\s+/g, ' ').trim() }
          : {}),
        ...(workLocation.trim() ? { workLocation: workLocation.trim() } : {}),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create user');
      if (!isProfile) setTab('details');
    } finally {
      setSubmitting(false);
    }
  };

  const onAvatarPick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file for the profile photo');
      return;
    }
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const toggleSpecialization = (item: string) => {
    setSpecializations((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item],
    );
  };

  const tabs = !isProfile ? (
    <div className="mt-4 flex gap-6" role="tablist" aria-label="Add user steps">
      {(
        [
          { id: 'details' as const, label: 'Details' },
          { id: 'permissions' as const, label: 'Permissions' },
        ] as const
      ).map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            id={`add-user-tab-${item.id}`}
            aria-controls={`add-user-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={cn(
              'relative pb-3 text-sm font-semibold transition',
              active ? 'text-[#B01828]' : 'text-[#758188] hover:text-[#1E2531]',
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#B01828]" />
            ) : null}
          </button>
        );
      })}
    </div>
  ) : null;

  const detailsFields = (
    <div className="space-y-4">
      {isProfile ? (
        <div className="flex justify-center pb-1">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#E9EEF0] text-[#758188]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10" aria-hidden />
              )}
            </div>
            <label
              htmlFor={fileInputId}
              className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#B01828] text-[#F8F8F8] shadow-soft hover:bg-[#800810]"
              title="Upload photo"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Upload profile photo</span>
            </label>
            <input
              id={fileInputId}
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onAvatarPick(e.target.files?.[0])}
            />
          </div>
        </div>
      ) : null}

      <FieldShell label="Full Name" required error={errors.name}>
        {({ id, describedBy }) => (
          <input
            id={id}
            className={formControlClass}
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy}
            autoComplete="name"
          />
        )}
      </FieldShell>

      <FieldShell label="Email" required error={errors.email}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type="email"
            className={inputSoft}
            placeholder={emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy}
            autoComplete="email"
          />
        )}
      </FieldShell>

      <FieldShell label="Password" required error={errors.password}>
        {({ id, describedBy }) => (
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                className={cn(inputSoft, 'pr-11')}
                placeholder="Generated password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#758188]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
              }}
              className="shrink-0 rounded-lg bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
            >
              Generate
            </button>
          </div>
        )}
      </FieldShell>

      <FieldShell
        label="Mobile"
        required
        error={errors.mobile}
        hint={isProfile ? 'Phone is collected here but not stored on the server yet.' : undefined}
      >
        {({ id, describedBy }) => (
          <div className="flex gap-2">
            <input
              aria-label="Country code"
              className={cn(formControlClass, 'w-[4.5rem] shrink-0 px-2 text-center')}
              value={mobileCode}
              onChange={(e) => setMobileCode(e.target.value)}
            />
            <input
              id={id}
              inputMode="numeric"
              maxLength={10}
              className={cn(formControlClass, 'min-w-0 flex-1')}
              placeholder="9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
              aria-invalid={errors.mobile ? true : undefined}
              aria-describedby={describedBy}
            />
          </div>
        )}
      </FieldShell>

      {!isStudent ? (
        <FieldShell label="Alternative Number">
          {({ id }) => (
            <div className="flex gap-2">
              <input
                aria-label="Alt country code"
                className={cn(formControlClass, 'w-[4.5rem] shrink-0 px-2 text-center')}
                value={altCode}
                onChange={(e) => setAltCode(e.target.value)}
              />
              <input
                id={id}
                inputMode="numeric"
                maxLength={10}
                className={cn(formControlClass, 'min-w-0 flex-1')}
                placeholder="Optional"
                value={altNumber}
                onChange={(e) => setAltNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
              />
            </div>
          )}
        </FieldShell>
      ) : null}

      {isStudent ? (
        <>
          <FieldShell label="Date of Birth" hint="Age is set automatically from this date">
            {({ id }) => (
              <div className="relative">
                <input
                  ref={dobInputRef}
                  id={id}
                  type="date"
                  max={todayIsoDate()}
                  className={cn(formControlClass, 'pr-10')}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  onInput={(e) => setDateOfBirth((e.target as HTMLInputElement).value)}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]"
                  aria-hidden
                />
              </div>
            )}
          </FieldShell>

          <FieldShell label="Age" required error={errors.age} hint="Auto-filled from date of birth; you can still change it">
            {({ id, describedBy }) => (
              <select
                id={id}
                className={formControlClass}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-invalid={errors.age ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="">Select age</option>
                {AGE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} {n === 1 ? 'year' : 'years'}
                  </option>
                ))}
              </select>
            )}
          </FieldShell>

          <FieldShell label="Gender" required error={errors.gender}>
            {({ id, describedBy }) => (
              <select
                id={id}
                className={formControlClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                aria-invalid={errors.gender ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            )}
          </FieldShell>

          <FieldShell label="Location">
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                placeholder="Enter location"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
              />
            )}
          </FieldShell>

          <p className="pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#758188]">
            Parent / Guardian
          </p>

          <FieldShell label="Parent Name">
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                placeholder="Enter parent or guardian name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            )}
          </FieldShell>

          <FieldShell label="Parent Number">
            {({ id }) => (
              <div className="flex gap-2">
                <input
                  aria-label="Parent country code"
                  className={cn(formControlClass, 'w-[4.5rem] shrink-0 px-2 text-center')}
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                />
                <input
                  id={id}
                  inputMode="numeric"
                  maxLength={10}
                  className={cn(formControlClass, 'min-w-0 flex-1')}
                  placeholder="Optional"
                  value={parentNumber}
                  onChange={(e) => setParentNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                />
              </div>
            )}
          </FieldShell>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-[#758188]">
              Known Languages <span className="text-[#E03040]">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E4DFE5] p-3">
              {LANGUAGE_OPTIONS.map((lang) => (
                <label key={lang} className="flex items-center gap-2 text-sm text-[#1E2531]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#E4DFE5] text-[#B01828] focus:ring-[#B01828]"
                    checked={languages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
            {errors.languages ? (
              <p className="mt-1 text-xs text-[#E03040]" role="alert">
                {errors.languages}
              </p>
            ) : null}
          </fieldset>
        </>
      ) : null}

      {isProfile && !isStudent ? (
        <>
          <FieldShell label="Gender" required error={errors.gender}>
            {({ id, describedBy }) => (
              <select
                id={id}
                className={formControlClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                aria-invalid={errors.gender ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            )}
          </FieldShell>

          <FieldShell label="Date of Birth">
            {({ id }) => (
              <div className="relative">
                <input
                  id={id}
                  type="date"
                  className={cn(formControlClass, 'pr-10')}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]"
                  aria-hidden
                />
              </div>
            )}
          </FieldShell>
        </>
      ) : null}

      {isUstad ? (
        <FieldShell label="Qualification" required error={errors.qualification}>
          {({ id, describedBy }) => (
            <input
              id={id}
              className={formControlClass}
              placeholder="e.g. Hafiz, Alim"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              aria-invalid={errors.qualification ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FieldShell>
      ) : null}

      {!isStudent ? (
        <FieldShell label="Work Location">
          {({ id }) => (
            <input
              id={id}
              className={formControlClass}
              placeholder="e.g. Chennai Office"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
            />
          )}
        </FieldShell>
      ) : null}

      {isUstad ? (
        <FieldShell label="Shift Timing" required error={errors.shiftTiming}>
          {({ id, describedBy }) => (
            <input
              id={id}
              className={formControlClass}
              placeholder="e.g. 9:00 AM – 5:00 PM"
              value={shiftTiming}
              onChange={(e) => setShiftTiming(e.target.value)}
              aria-invalid={errors.shiftTiming ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FieldShell>
      ) : null}

      {isProfile && !isStudent ? (
        <>
          <FieldShell label="Date of Joining" required error={errors.dateOfJoining}>
            {({ id, describedBy }) => (
              <div className="relative">
                <input
                  id={id}
                  type="date"
                  className={cn(formControlClass, 'pr-10')}
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  aria-invalid={errors.dateOfJoining ? true : undefined}
                  aria-describedby={describedBy}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]"
                  aria-hidden
                />
              </div>
            )}
          </FieldShell>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-[#758188]">
              Languages <span className="text-[#E03040]">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGE_OPTIONS.map((lang) => (
                <label key={lang} className="flex items-center gap-2 text-sm text-[#1E2531]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#E4DFE5] text-[#B01828] focus:ring-[#B01828]"
                    checked={languages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
            {errors.languages ? (
              <p className="mt-1 text-xs text-[#E03040]" role="alert">
                {errors.languages}
              </p>
            ) : null}
          </fieldset>

          {isUstad ? (
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-[#758188]">
                Specialization <span className="text-[#E03040]">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {SPECIALIZATION_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-[#1E2531]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#E4DFE5] text-[#B01828] focus:ring-[#B01828]"
                      checked={specializations.includes(item)}
                      onChange={() => toggleSpecialization(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
              {errors.specializations ? (
                <p className="mt-1 text-xs text-[#E03040]" role="alert">
                  {errors.specializations}
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </>
      ) : null}

      {formError ? (
        <p className="text-sm text-[#E03040]" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      busy={submitting}
      variant="drawer"
      headerExtra={tabs}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {isProfile || tab === 'details' ? (
            <div
              id="add-user-panel-details"
              role={isProfile ? undefined : 'tabpanel'}
              aria-labelledby={isProfile ? undefined : 'add-user-tab-details'}
            >
              {detailsFields}
            </div>
          ) : (
            <div
              id="add-user-panel-permissions"
              role="tabpanel"
              aria-labelledby="add-user-tab-permissions"
              className="space-y-4"
            >
              <p className="text-sm text-[#758188]">
                Detailed permission editing is not available yet. This account will be created with
                the selected management role for this page.
              </p>
              <ul className="space-y-2 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-4 text-sm text-[#1E2531]">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#B01828]" aria-hidden />
                  Access to role dashboards and assigned modules
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#B01828]" aria-hidden />
                  User management limited by their role
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#B01828]" aria-hidden />
                  Fine-grained permissions UI coming later
                </li>
              </ul>
              {formError ? (
                <p className="text-sm text-[#E03040]" role="alert">
                  {formError}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#E4DFE5] bg-[#F8F8F8] px-5 py-4">
          {isProfile ? (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="w-full rounded-lg bg-[#B01828] px-4 py-3 text-sm font-semibold text-[#F8F8F8] shadow-soft transition hover:bg-[#800810] disabled:opacity-60"
            >
              {submitting ? 'Creating…' : submitLabel}
            </button>
          ) : tab === 'details' ? (
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="w-full rounded-lg bg-[#B01828] px-4 py-3 text-sm font-semibold text-[#F8F8F8] shadow-soft transition hover:bg-[#800810] disabled:opacity-60"
            >
              Next
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTab('details')}
                disabled={submitting}
                className="rounded-lg border border-[#E4DFE5] bg-[#F8F8F8] px-4 py-3 text-sm font-semibold text-[#1E2531] hover:bg-[#E9EEF0] disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={submitting}
                className="min-w-0 flex-1 rounded-lg bg-[#B01828] px-4 py-3 text-sm font-semibold text-[#F8F8F8] shadow-soft transition hover:bg-[#800810] disabled:opacity-60"
              >
                {submitting ? 'Creating…' : submitLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AddManagedUserModal;
