import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';
import { cn } from '@dlos/ui';

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword], color: 'var(--syntax-keyword)' },
  { tag: [t.string, t.regexp, t.special(t.string)], color: 'var(--syntax-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--syntax-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.propertyName], color: 'var(--syntax-function)' },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--syntax-type)' },
]);

/** Colours come from CSS variables, so the editor follows the light and dark theme automatically. */
const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: 'var(--card)', color: 'var(--foreground)' },
  '&.cm-focused': { outline: '2px solid var(--ring)', outlineOffset: '-2px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', lineHeight: '1.65', overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--foreground)', padding: '0.5rem 0' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-gutters': { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklch, var(--accent) 45%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--accent)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 28%, transparent)',
  },
  '.cm-tooltip': { backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)' },
});

export interface CodeEditorProps {
  value: string;
  language: 'typescript' | 'javascript';
  label: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  className?: string;
}

export function CodeEditor({ value, language, label, onChange, onRun, onSubmit, className }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const languageSlot = useRef(new Compartment());
  const callbacks = useRef({ onChange, onRun, onSubmit });
  const initial = useRef({ value, language, label });

  useEffect(() => {
    callbacks.current = { onChange, onRun, onSubmit };
  });

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const editor = new EditorView({
      parent,
      state: EditorState.create({
        doc: initial.current.value,
        extensions: [
          basicSetup,
          languageSlot.current.of(javascript({ typescript: initial.current.language === 'typescript' })),
          theme,
          syntaxHighlighting(highlight),
          keymap.of([
            { key: 'Mod-Enter', run: () => (callbacks.current.onRun(), true) },
            { key: 'Mod-Shift-Enter', run: () => (callbacks.current.onSubmit(), true) },
            // Tab indents inside the editor, so Escape is the way out for keyboard users.
            { key: 'Escape', run: () => (parent.focus(), true) },
            indentWithTab,
          ]),
          // An explicit tabindex lets assistive tools see that the scrollable editor can be reached with the keyboard.
          EditorView.contentAttributes.of({ 'aria-label': initial.current.label, tabindex: '0' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: languageSlot.current.reconfigure(javascript({ typescript: language === 'typescript' })) });
  }, [language]);

  return <div ref={host} tabIndex={-1} className={cn('min-h-0 overflow-hidden outline-none', className)} />;
}
