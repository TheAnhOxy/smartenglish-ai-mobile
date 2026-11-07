export interface SpeechResult { 0: { transcript: string }; isFinal: boolean }
export interface SpeechRecognizer {
  lang: string; interimResults: boolean; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: { results: ArrayLike<SpeechResult>; resultIndex: number }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
export interface DictationSession { stop(): void; cancel(): void }

export const startBrowserDictation = (
  recognizer: SpeechRecognizer, language: string,
  onInterim: (text: string) => void, onFinal: (text: string) => void,
  onError: (message: string) => void, onEnd: () => void,
): DictationSession => {
  let finished = false;
  let transcript = '';
  const finish = (send: boolean) => {
    if (finished) return;
    finished = true;
    recognizer.abort();
    onEnd();
    if (send && transcript.trim()) onFinal(transcript.trim().slice(0, 4000));
  };
  recognizer.lang = language;
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.onresult = (event) => {
    if (finished) return;
    transcript = Array.from(event.results).map((r) => r[0].transcript).join(' ');
    onInterim(transcript);
    if (Array.from(event.results).some((r) => r.isFinal)) finish(true);
  };
  recognizer.onerror = (event) => {
    if (finished) return;
    finish(false);
    onError(event.error === 'not-allowed'
      ? 'Bạn chưa cho phép micro. Hãy cấp quyền micro cho trang này.'
      : event.error === 'no-speech' ? 'Chưa nghe rõ giọng nói. Hãy bấm micro và thử lại.'
      : 'Trình duyệt chưa nhận được giọng nói. Bạn có thể chuyển sang chế độ ghi âm.');
  };
  recognizer.onend = () => finish(true);
  try { recognizer.start(); } catch { finish(false); onError('Không thể mở micro. Vui lòng thử lại.'); }
  return { stop: () => recognizer.stop(), cancel: () => finish(false) };
};
