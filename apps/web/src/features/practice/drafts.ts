import type { PracticeLanguage } from '@dlos/shared';

const draftKey = (slug: string, language: PracticeLanguage) => `dlos-draft:${slug}:${language}`;
const LANGUAGE_KEY = 'dlos-practice-language';

/** Drafts live in this browser only; accepted submissions are also saved by the API. */
export function loadDraft(slug: string, language: PracticeLanguage): string | null {
  try {
    return window.localStorage.getItem(draftKey(slug, language));
  } catch {
    return null;
  }
}

export function saveDraft(slug: string, language: PracticeLanguage, code: string): void {
  try {
    window.localStorage.setItem(draftKey(slug, language), code);
  } catch {
    /* storage full or blocked: the editor keeps working */
  }
}

export function clearDraft(slug: string, language: PracticeLanguage): void {
  try {
    window.localStorage.removeItem(draftKey(slug, language));
  } catch {
    /* ignore */
  }
}

export function loadLanguage(): PracticeLanguage {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) === 'javascript' ? 'javascript' : 'typescript';
  } catch {
    return 'typescript';
  }
}

export function saveLanguage(language: PracticeLanguage): void {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* ignore */
  }
}
