import { cn } from '@dlos/ui';
import { Link } from 'react-router';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <defs>
        <linearGradient id="dlos-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#dlos-logo)" />
      <path
        d="M24 22 14 32l10 10M40 22l10 10-10 10"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m35 20-6 24" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  to = '/dashboard',
  showName = true,
  className,
}: {
  to?: string;
  showName?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label="Developer Learning OS"
      className={cn(
        'flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        className,
      )}
    >
      <LogoMark />
      {showName ? (
        <span className="text-[0.95rem] leading-tight font-semibold tracking-tight">
          Developer
          <br />
          <span className="text-muted-foreground">Learning OS</span>
        </span>
      ) : null}
    </Link>
  );
}
