import type { LessonVideo } from '@dlos/shared';
import { cn } from '@dlos/ui';
import { ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Click-to-play YouTube embed. Nothing is requested from YouTube until the learner presses play,
 * and the privacy-enhanced domain (youtube-nocookie.com) is used.
 */
export function VideoPlayer({ video, className }: { video: LessonVideo; className?: string }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const src = `${video.embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <figure className={cn('space-y-2', className)}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border bg-neutral-950 shadow-card">
        {playing ? (
          <iframe
            src={src}
            title={video.title}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(60%_80%_at_50%_0%,oklch(0.42_0.16_272),oklch(0.2_0.05_266))] p-6 text-center text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg transition-transform group-hover:scale-105">
              <Play aria-hidden="true" className="ml-1 size-7 fill-current" />
            </span>
            <span className="max-w-xl text-base font-medium text-balance sm:text-lg">{video.title}</span>
            <span className="text-sm text-white/80">{t('lesson.playVideo')}</span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="min-w-0">
          <span className="font-medium text-foreground">{video.author}</span>
        </span>
        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
        >
          {t('lesson.openOnYoutube')}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </figcaption>
    </figure>
  );
}
