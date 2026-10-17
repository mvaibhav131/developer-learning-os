import type { TrackSlug } from '@dlos/shared';
import { cn } from '@dlos/ui';
import { CONTENT_ICONS, FALLBACK_CONTENT_ICON, TRACK_STYLE } from '../lib/tracks';

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function Pattern({ variant, seed }: { variant: number; seed: number }) {
  const shift = seed % 60;
  switch (variant) {
    case 0:
      return (
        <g fill="none" stroke="white" strokeOpacity="0.22">
          {[30, 60, 90, 120].map((radius) => (
            <circle key={radius} cx={250 + shift / 4} cy={150 - shift / 3} r={radius} strokeWidth="1.5" />
          ))}
        </g>
      );
    case 1:
      return (
        <g fill="white" fillOpacity="0.2">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 14 }, (_, column) => (
              <circle key={`${row}-${column}`} cx={20 + column * 24 + (row % 2) * 12} cy={18 + row * 22} r="2" />
            )),
          )}
        </g>
      );
    case 2:
      return (
        <g fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2">
          {[0, 1, 2, 3, 4].map((line) => (
            <path
              key={line}
              d={`M-10 ${40 + line * 28} C 70 ${10 + line * 28 + shift / 3}, 150 ${90 + line * 28}, 330 ${50 + line * 28 - shift / 4}`}
            />
          ))}
        </g>
      );
    default:
      return (
        <g fill="white" fillOpacity="0.16">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <rect
              key={index}
              x={150 + ((seed >> index) % 150)}
              y={20 + ((seed >> (index + 3)) % 100)}
              width={26 + index * 6}
              height={26 + index * 6}
              rx="8"
              transform={`rotate(${(index * 17 + shift) % 45} 200 90)`}
            />
          ))}
        </g>
      );
  }
}

/** Generative course artwork: deterministic per course, no external images. */
export function CourseThumbnail({
  seed,
  track,
  icon,
  className,
}: {
  seed: string;
  track: TrackSlug;
  icon: string;
  className?: string;
}) {
  const style = TRACK_STYLE[track];
  const value = hash(seed);
  const Icon = CONTENT_ICONS[icon] ?? FALLBACK_CONTENT_ICON;
  return (
    <div
      aria-hidden="true"
      className={cn('relative aspect-video overflow-hidden rounded-xl', className)}
      style={{ background: style.gradient }}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
      >
        <Pattern variant={value % 4} seed={value >> 3} />
      </svg>
      <span className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
        <Icon className="size-6" />
      </span>
    </div>
  );
}
