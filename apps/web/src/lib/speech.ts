import { useCallback, useEffect, useRef, useState } from 'react';

const speechSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Reads English aloud with the voices already installed in the browser. Nothing is sent anywhere. */
export function useSpeech() {
  const supported = speechSupported();
  const [speaking, setSpeaking] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  const speak = useCallback((text: string, slow = false) => {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = slow ? 0.65 : 0.95;
    const done = () => setSpeaking((current) => (current === text ? null : current));
    utterance.onend = done;
    utterance.onerror = done;
    setSpeaking(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(
    () => () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    },
    [],
  );

  return { supported, speaking, speak, stop };
}

export type RecorderState = 'idle' | 'recording' | 'denied';

/** Records short clips from the microphone and keeps them in memory only, never uploading them. */
export function useRecorder() {
  const supported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window;
  const [state, setState] = useState<RecorderState>('idle');
  const [clips, setClips] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const urls = useRef<string[]>([]);

  const start = useCallback(async (key: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const instance = new MediaRecorder(stream);
      instance.ondataavailable = (event) => chunks.push(event.data);
      instance.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const url = URL.createObjectURL(new Blob(chunks, { type: instance.mimeType || 'audio/webm' }));
        urls.current.push(url);
        setClips((previous) => ({ ...previous, [key]: url }));
        setState('idle');
        setActiveKey(null);
      };
      recorder.current = instance;
      instance.start();
      setActiveKey(key);
      setState('recording');
    } catch {
      setState('denied');
    }
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') recorder.current.stop();
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  return { supported, state, activeKey, clips, start, stop };
}
