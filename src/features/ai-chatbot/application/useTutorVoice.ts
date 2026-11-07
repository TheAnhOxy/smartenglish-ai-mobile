import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { TutorAudio } from '../data/chatbotApi';
import { DictationSession, SpeechRecognizer, startBrowserDictation } from '../data/browserDictation';

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognizer;
  webkitSpeechRecognition?: new () => SpeechRecognizer;
};
const blobBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string'
    ? resolve(reader.result.split(',')[1]) : reject(new Error('Không đọc được ghi âm.'));
  reader.onerror = () => reject(new Error('Không đọc được ghi âm.'));
  reader.readAsDataURL(blob);
});

export const useTutorVoice = (callbacks: {
  onText: (text: string) => void;
  onAudio: (audio: TutorAudio) => void;
  onInterim: (text: string) => void;
}) => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const handlers = useRef(callbacks); handlers.current = callbacks;
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en-US' | 'vi-VN'>('en-US');
  const [recordAudio, setRecordAudio] = useState(false);
  const dictation = useRef<DictationSession | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const version = useRef(0);
  const opening = useRef(false);
  const finish = useCallback(() => {
    setListening(false); opening.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const cancel = useCallback(() => {
    version.current++;
    dictation.current?.cancel(); dictation.current = null;
    if (media.current) {
      media.current.onstop = null;
      if (media.current.state !== 'inactive') media.current.stop();
      media.current.stream.getTracks().forEach((track) => track.stop());
      media.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (Platform.OS !== 'web') {
      void (recorder.isRecording ? recorder.stop() : Promise.resolve())
        .then(() => setAudioModeAsync({ allowsRecording: false })).catch(() => undefined);
    }
    finish(); setProcessing(false);
  }, [recorder, finish]);

  const stop = useCallback(async () => {
    if (dictation.current) { dictation.current.stop(); return; }
    if (media.current) {
      if (media.current.state !== 'inactive') media.current.stop();
      return;
    }
    const activeVersion = version.current;
    if (recorder.isRecording) {
      finish(); setProcessing(true);
      try {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        if (!recorder.uri) throw new Error('Không đọc được ghi âm.');
        const file = new File(recorder.uri);
        if (file.size > 2_000_000) throw new Error('Ghi âm quá dài. Hãy thử câu ngắn hơn.');
        const base64 = await file.base64();
        if (activeVersion === version.current) handlers.current.onAudio({ base64, mimeType: 'audio/mp4' });
      } catch (failure: unknown) {
        if (activeVersion === version.current) setError(failure instanceof Error ? failure.message : 'Không đọc được ghi âm.');
      } finally { setProcessing(false); }
    }
  }, [recorder, finish]);

  const start = useCallback(async () => {
    if (opening.current) return;
    opening.current = true; setError('');
    const activeVersion = ++version.current;
    try {
      if (Platform.OS === 'web') {
        const browser = window as SpeechWindow;
        const SpeechClass = browser.SpeechRecognition || browser.webkitSpeechRecognition;
        if (SpeechClass && !recordAudio) {
          setListening(true);
          dictation.current = startBrowserDictation(new SpeechClass(), language,
            (text) => handlers.current.onInterim(text),
            (text) => { if (activeVersion === version.current) handlers.current.onText(text); },
            setError, () => { dictation.current = null; finish(); });
        } else {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro cần HTTPS hoặc localhost.');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (activeVersion !== version.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
          const recording = new MediaRecorder(stream, { mimeType });
          const chunks: BlobPart[] = [];
          recording.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
          recording.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; media.current = null;
            finish(); setProcessing(true);
            try {
              const blob = new Blob(chunks, { type: mimeType });
              if (!blob.size || blob.size > 2_000_000) throw new Error('Ghi âm trống hoặc quá dài. Hãy thử lại.');
              const base64 = await blobBase64(blob);
              if (activeVersion === version.current) handlers.current.onAudio({ base64, mimeType });
            } catch (failure: unknown) {
              if (activeVersion === version.current) setError(failure instanceof Error ? failure.message : 'Không đọc được ghi âm.');
            } finally { setProcessing(false); }
          };
          recording.onerror = () => { cancel(); setError('Không thể ghi âm. Hãy thử lại.'); };
          recording.start(); media.current = recording; setListening(true);
        }
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) throw new Error('Hãy cấp quyền micro trong cài đặt ứng dụng.');
        if (activeVersion !== version.current) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (activeVersion !== version.current) { await setAudioModeAsync({ allowsRecording: false }); return; }
        recorder.record(); setListening(true);
      }
      if (activeVersion === version.current && opening.current) {
        timer.current = setTimeout(() => { void stop(); }, 20_000);
      }
    } catch (failure: unknown) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      finish();
      setError(failure instanceof Error ? failure.message : 'Không thể mở micro.');
    }
  }, [cancel, finish, language, recordAudio, recorder, stop]);

  useEffect(() => () => cancel(), [cancel]);
  return { listening, processing, error, language, setLanguage, recordAudio, setRecordAudio,
    cancel, stop, start };
};
