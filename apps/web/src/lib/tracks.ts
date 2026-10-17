import {
  Binary,
  BookOpen,
  Boxes,
  Brain,
  Briefcase,
  Cloud,
  Code,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Headphones,
  Languages,
  Layers,
  MessageCircle,
  Mic,
  Network,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Target,
  Terminal,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { TrackSlug } from '@dlos/shared';

export interface TrackStyle {
  icon: LucideIcon;
  badge: TrackSlug;
  text: string;
  soft: string;
  bar: string;
  ring: string;
  /** Fixed (theme independent) gradient so white icons keep their contrast in both themes. */
  gradient: string;
  chart: string;
}

export const TRACK_STYLE: Record<TrackSlug, TrackStyle> = {
  ai: {
    icon: Brain,
    badge: 'ai',
    text: 'text-track-ai',
    soft: 'bg-track-ai/12',
    bar: 'bg-track-ai',
    ring: 'ring-track-ai/30',
    gradient: 'linear-gradient(135deg, oklch(0.46 0.23 295), oklch(0.38 0.2 268))',
    chart: 'var(--track-ai)',
  },
  dsa: {
    icon: Binary,
    badge: 'dsa',
    text: 'text-track-dsa',
    soft: 'bg-track-dsa/12',
    bar: 'bg-track-dsa',
    ring: 'ring-track-dsa/30',
    gradient: 'linear-gradient(135deg, oklch(0.47 0.2 255), oklch(0.37 0.17 275))',
    chart: 'var(--track-dsa)',
  },
  'system-design': {
    icon: Network,
    badge: 'system-design',
    text: 'text-track-system-design',
    soft: 'bg-track-system-design/12',
    bar: 'bg-track-system-design',
    ring: 'ring-track-system-design/30',
    gradient: 'linear-gradient(135deg, oklch(0.48 0.12 215), oklch(0.38 0.13 250))',
    chart: 'var(--track-system-design)',
  },
  'full-stack': {
    icon: Layers,
    badge: 'full-stack',
    text: 'text-track-full-stack',
    soft: 'bg-track-full-stack/12',
    bar: 'bg-track-full-stack',
    ring: 'ring-track-full-stack/30',
    gradient: 'linear-gradient(135deg, oklch(0.47 0.11 170), oklch(0.37 0.12 215))',
    chart: 'var(--track-full-stack)',
  },
  interview: {
    icon: Target,
    badge: 'interview',
    text: 'text-track-interview',
    soft: 'bg-track-interview/14',
    bar: 'bg-track-interview',
    ring: 'ring-track-interview/30',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.13 60), oklch(0.4 0.14 25))',
    chart: 'var(--track-interview)',
  },
  english: {
    icon: Languages,
    badge: 'english',
    text: 'text-track-english',
    soft: 'bg-track-english/12',
    bar: 'bg-track-english',
    ring: 'ring-track-english/30',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.2 350), oklch(0.4 0.17 320))',
    chart: 'var(--track-english)',
  },
};

/** Maps the icon identifiers stored with the curriculum to Lucide components. */
export const CONTENT_ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  sparkles: Sparkles,
  database: Database,
  workflow: Workflow,
  'git-branch': GitBranch,
  rocket: Rocket,
  binary: Binary,
  boxes: Boxes,
  network: Network,
  cpu: Cpu,
  server: Server,
  layers: Layers,
  code: Code,
  target: Target,
  shield: Shield,
  cloud: Cloud,
  flask: FlaskConical,
  terminal: Terminal,
  languages: Languages,
  mic: Mic,
  'message-circle': MessageCircle,
  briefcase: Briefcase,
  headphones: Headphones,
};

export const FALLBACK_CONTENT_ICON: LucideIcon = BookOpen;
