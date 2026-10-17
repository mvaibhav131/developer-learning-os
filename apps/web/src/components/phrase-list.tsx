import { Button, Switch, cn } from '@dlos/ui';
import { Check, Copy, Mic, Square, Volume2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecorder, useSpeech } from '../lib/speech';

function CopyPhrase({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={t('lesson.copyPhrase', { phrase: text })}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
    </Button>
  );
}

/**
 * Practice phrases from a ```phrases block: listen with the browser voice, record yourself and play
 * the recording back to compare (shadowing). Recordings stay in the tab and are never uploaded.
 */
export function PhraseList({ phrases }: { phrases: string[] }) {
  const { t } = useTranslation();
  const slowId = useId();
  const speech = useSpeech();
  const recorder = useRecorder();
  const [slow, setSlow] = useState(false);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border bg-card print:break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/50 px-4 py-2 text-sm print:hidden">
        <span className="font-medium">{t('lesson.phrasesTitle')}</span>
        {speech.supported ? (
          <label htmlFor={slowId} className="flex items-center gap-2 text-muted-foreground">
            <Switch id={slowId} checked={slow} onCheckedChange={setSlow} />
            {t('lesson.slowSpeech')}
          </label>
        ) : null}
      </div>
      <ul className="divide-y">
        {phrases.map((phrase) => {
          const isSpeaking = speech.speaking === phrase;
          const isRecording = recorder.activeKey === phrase;
          const clip = recorder.clips[phrase];
          return (
            <li key={phrase} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <span className="min-w-0 flex-1 basis-56 text-[0.95rem]">{phrase}</span>
              <span className="flex flex-wrap items-center gap-1 print:hidden">
                {speech.supported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={isSpeaking ? t('lesson.stopListening') : t('lesson.listenTo', { phrase })}
                    aria-pressed={isSpeaking}
                    className={cn(isSpeaking && 'bg-accent text-accent-foreground')}
                    onClick={() => (isSpeaking ? speech.stop() : speech.speak(phrase, slow))}
                  >
                    {isSpeaking ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                  </Button>
                ) : null}
                {recorder.supported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={isRecording ? t('lesson.stopRecording') : t('lesson.recordPhrase', { phrase })}
                    aria-pressed={isRecording}
                    disabled={recorder.state === 'recording' && !isRecording}
                    className={cn(isRecording && 'bg-destructive/15 text-destructive')}
                    onClick={() => (isRecording ? recorder.stop() : void recorder.start(phrase))}
                  >
                    {isRecording ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                  </Button>
                ) : null}
                {clip ? (
                  // Playback of the learner's own recording: there is no transcript to caption.
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls src={clip} aria-label={t('lesson.yourRecording', { phrase })} className="h-8 max-w-44" />
                ) : null}
                <CopyPhrase text={phrase} />
              </span>
            </li>
          );
        })}
      </ul>
      {recorder.state === 'denied' ? (
        <p role="alert" className="border-t px-4 py-2 text-sm text-destructive print:hidden">
          {t('lesson.micDenied')}
        </p>
      ) : null}
      {speech.supported || recorder.supported ? (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground print:hidden">
          {t('lesson.speechNote')}
          {recorder.supported ? ` ${t('lesson.recordNote')}` : ''}
        </p>
      ) : null}
    </div>
  );
}
