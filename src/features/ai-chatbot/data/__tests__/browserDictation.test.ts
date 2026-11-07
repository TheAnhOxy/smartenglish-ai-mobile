import { startBrowserDictation, SpeechRecognizer } from '../browserDictation';
const fake = () => ({ start: jest.fn(), stop: jest.fn(), abort: jest.fn(), lang: '',
  interimResults: false, continuous: false, onresult: null, onerror: null, onend: null }) as SpeechRecognizer;
test('final speech sends once and stops recognition', () => {
  const recognizer = fake(); const onFinal = jest.fn();
  startBrowserDictation(recognizer, 'en-US', jest.fn(), onFinal, jest.fn(), jest.fn());
  recognizer.onresult?.({ results: [{ 0: { transcript: 'Hello tutor' }, isFinal: true }], resultIndex: 0 });
  recognizer.onend?.();
  expect(onFinal).toHaveBeenCalledTimes(1);
  expect(onFinal).toHaveBeenCalledWith('Hello tutor');
  expect(recognizer.abort).toHaveBeenCalled();
});
test('permission denial never sends text', () => {
  const recognizer = fake(); const onFinal = jest.fn(); const onError = jest.fn();
  startBrowserDictation(recognizer, 'vi-VN', jest.fn(), onFinal, onError, jest.fn());
  recognizer.onerror?.({ error: 'not-allowed' }); recognizer.onend?.();
  expect(onFinal).not.toHaveBeenCalled(); expect(onError).toHaveBeenCalled();
});
