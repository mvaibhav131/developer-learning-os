import { slugifyHeading } from '@dlos/shared';
import { Button, cn } from '@dlos/ui';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { Check, Copy, Download } from 'lucide-react';
import { isValidElement, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { downloadTextFile, fileSafe, toCsv } from '../lib/download';
import { textOf } from '../lib/text-of';
import { PhraseList } from './phrase-list';

const LANGUAGES = { bash, css, diff, javascript, json, markdown, python, sql, typescript, xml, yaml };
const ALIASES = {
  typescript: ['ts', 'tsx'],
  javascript: ['js', 'jsx'],
  bash: ['sh', 'shell', 'zsh'],
  xml: ['html'],
  yaml: ['yml'],
};
const PLAIN = ['phrases', 'text', 'txt', 'plaintext'];

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={t('lesson.copyCode')}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md border bg-card/90 text-muted-foreground opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 print:hidden"
    >
      {copied ? <Check aria-hidden="true" className="size-4 text-success" /> : <Copy aria-hidden="true" className="size-4" />}
    </button>
  );
}

function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return <Tag id={slugifyHeading(textOf(children))}>{children}</Tag>;
}

/** Every table can be saved as a CSV file, handy for vocabulary lists you want in a spreadsheet or Anki. */
function MarkdownTable({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const table = useRef<HTMLTableElement>(null);
  const save = () => {
    const rows = Array.from(table.current?.rows ?? []).map((row) =>
      Array.from(row.cells).map((cell) => (cell.textContent ?? '').trim()),
    );
    downloadTextFile(`${fileSafe(document.title.split('·')[0] ?? 'table')}-table.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };
  return (
    <div className="my-6 space-y-2">
      <div className="overflow-x-auto">
        <table ref={table} className="!my-0">
          {children}
        </table>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={save} className="print:hidden">
        <Download aria-hidden="true" />
        {t('lesson.downloadTable')}
      </Button>
    </div>
  );
}

const components: Components = {
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  a: ({ href = '', children }: ComponentProps<'a'>) => {
    if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
    if (href.startsWith('#')) return <a href={href}>{children}</a>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  pre: ({ children }) => {
    const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children : null;
    if (code?.props.className?.split(' ').includes('language-phrases')) {
      const phrases = textOf(code.props.children)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return <PhraseList phrases={phrases} />;
    }
    return (
      <div className="group relative">
        {/* Scrollable code must be reachable by keyboard. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <pre tabIndex={0}>{children}</pre>
        <CopyButton text={textOf(children)} />
      </div>
    );
  },
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
};

/** Renders lesson Markdown. Raw HTML is never rendered, so authored content cannot inject scripts. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        'lesson-prose prose max-w-none prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { languages: LANGUAGES, aliases: ALIASES, detect: false, plainText: PLAIN, ignoreMissing: true }],
        ]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
