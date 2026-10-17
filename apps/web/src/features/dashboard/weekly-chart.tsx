import type { Dashboard } from '@dlos/shared';
import { TRACK_SLUGS } from '@dlos/shared';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../../lib/format';
import { TRACK_STYLE } from '../../lib/tracks';

interface TooltipPayload {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const rows = payload.filter((item) => (item.value ?? 0) > 0);
  const total = rows.reduce((sum, item) => sum + (item.value ?? 0), 0);
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold">{label}</p>
      {rows.map((item) => (
        <p key={String(item.dataKey)} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          {t(`tracks.${String(item.dataKey)}` as 'tracks.ai')}: {t('common.minutes', { value: item.value })}
        </p>
      ))}
      <p className="mt-1 border-t pt-1 font-medium">{t('common.minutes', { value: total })}</p>
    </div>
  );
}

export default function WeeklyChart({ days }: { days: Dashboard['weekly']['days'] }) {
  const format = useFormatters();
  const data = days.map((day) => ({
    label: format.weekday(day.date, 'short'),
    ...day.byTrack,
  }));
  const lastTrack = TRACK_SLUGS[TRACK_SLUGS.length - 1];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={48}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
        {TRACK_SLUGS.map((slug) => (
          <Bar
            key={slug}
            dataKey={slug}
            stackId="minutes"
            fill={TRACK_STYLE[slug].chart}
            radius={slug === lastTrack ? [4, 4, 0, 0] : 0}
            maxBarSize={44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
