import type { TrackSlug } from '@dlos/shared';
import {
  Bookmark,
  ChartColumn,
  CodeXml,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  Library,
  MapIcon,
  NotebookPen,
  Rocket,
  Settings,
  SquareStack,
  Target,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ParseKeys } from 'i18next';
import { TRACK_STYLE } from '../lib/tracks';

export interface NavItem {
  to: string;
  labelKey: ParseKeys;
  icon: LucideIcon;
  /** Planned items stay reachable but are marked, and their page says what phase builds them. */
  planned?: boolean;
  end?: boolean;
  trackSlug?: TrackSlug;
}

export interface NavGroup {
  id: string;
  labelKey: ParseKeys;
  items: NavItem[];
}

const trackItem = (slug: TrackSlug): NavItem => ({
  to: `/learn/${slug}`,
  labelKey: `tracks.${slug}`,
  icon: TRACK_STYLE[slug].icon,
  trackSlug: slug,
});

/** Only places that work today are listed. Planned screens stay reachable by URL, not by menu. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    labelKey: 'nav.groups.overview',
    items: [
      { to: '/dashboard', labelKey: 'nav.items.dashboard', icon: LayoutDashboard },
      { to: '/roadmap', labelKey: 'nav.items.roadmap', icon: MapIcon },
    ],
  },
  {
    id: 'learn',
    labelKey: 'nav.groups.learn',
    items: [
      { to: '/learn', labelKey: 'nav.items.learn', icon: GraduationCap, end: true },
      trackItem('ai'),
      trackItem('dsa'),
      trackItem('system-design'),
      trackItem('full-stack'),
      trackItem('interview'),
      trackItem('english'),
    ],
  },
  {
    id: 'practice',
    labelKey: 'nav.groups.practice',
    items: [
      { to: '/practice', labelKey: 'nav.items.dsaPractice', icon: CodeXml },
      { to: '/projects', labelKey: 'nav.items.projects', icon: FlaskConical },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = {
  to: '/settings',
  labelKey: 'nav.items.settings',
  icon: Settings,
};

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((group) => group.items), SETTINGS_ITEM];

/** Which build phase delivers each planned route (shown on the "not built yet" screens). */
export const PLANNED_ROUTES: Array<{
  path: string;
  feature:
    | 'analytics'
    | 'resources'
    | 'dsaPractice'
    | 'dsaProblem'
    | 'quiz'
    | 'interviewPractice'
    | 'revision'
    | 'flashcards'
    | 'playground'
    | 'rag'
    | 'algorithms'
    | 'architecture'
    | 'notes'
    | 'bookmarks';
  phase: number;
  icon: LucideIcon;
  titleKey: ParseKeys;
}> = [
  { path: 'analytics', feature: 'analytics', phase: 6, icon: ChartColumn, titleKey: 'nav.items.analytics' },
  { path: 'resources', feature: 'resources', phase: 2, icon: Library, titleKey: 'nav.items.resources' },
  { path: 'practice/interview', feature: 'interviewPractice', phase: 6, icon: Target, titleKey: 'nav.items.interviewPractice' },
  { path: 'revision', feature: 'revision', phase: 3, icon: Rocket, titleKey: 'nav.items.revision' },
  { path: 'flashcards', feature: 'flashcards', phase: 2, icon: SquareStack, titleKey: 'nav.items.flashcards' },
  { path: 'playground', feature: 'playground', phase: 3, icon: Wrench, titleKey: 'nav.items.playground' },
  { path: 'playground/rag', feature: 'rag', phase: 5, icon: Wrench, titleKey: 'nav.items.playground' },
  { path: 'playground/algorithms', feature: 'algorithms', phase: 3, icon: Wrench, titleKey: 'nav.items.playground' },
  { path: 'architecture', feature: 'architecture', phase: 4, icon: Layers3, titleKey: 'nav.items.architecture' },
  { path: 'notes', feature: 'notes', phase: 2, icon: NotebookPen, titleKey: 'nav.items.notes' },
  { path: 'bookmarks', feature: 'bookmarks', phase: 2, icon: Bookmark, titleKey: 'nav.items.bookmarks' },
];
