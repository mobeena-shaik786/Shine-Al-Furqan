import { cn, initials } from '../../lib/utils';

interface UserAvatarProps {
  firstName: string;
  lastName?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({
  firstName,
  lastName,
  src,
  size = 'md',
  className,
}: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName ?? ''}`}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-surface-muted font-semibold text-[#B91C1C]',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </div>
  );
}
