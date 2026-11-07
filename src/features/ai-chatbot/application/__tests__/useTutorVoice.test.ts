import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useTutorVoice } from '../useTutorVoice';
import { SpeechRecognizer } from '../../data/browserDictation';
jest.mock('expo-audio', () => ({
  useAudioRecorder: () => mockRecorder,
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
const mockRecorder = { isRecording: false, stop: jest.fn().mockResolvedValue(undefined) };
const recognition = { start: jest.fn(), stop: jest.fn(), abort: jest.fn(), lang: '',
  interimResults: false, continuous: false, onresult: null, onerror: null, onend: null } as SpeechRecognizer;
const originalOS = Platform.OS;
const originalWindow = global.window;
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  global.window = { SpeechRecognition: jest.fn(() => recognition) } as unknown as Window & typeof globalThis;
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  global.window = originalWindow;
  jest.clearAllMocks();
});
test('voice hook sends final text and releases recognition', async () => {
  const onText = jest.fn();
  const { result, unmount } = renderHook(() => useTutorVoice({ onText, onAudio: jest.fn(), onInterim: jest.fn() }));
  await act(() => result.current.start());
  expect(result.current.listening).toBe(true);
  act(() => recognition.onresult?.({ results: [{ 0: { transcript: 'Hello tutor' }, isFinal: true }], resultIndex: 0 }));
  expect(onText).toHaveBeenCalledWith('Hello tutor');
  expect(result.current.listening).toBe(false);
  unmount();
});
test('cancelling a microphone session prevents late speech submission', async () => {
  const onText = jest.fn(); const onInterim = jest.fn();
  const { result, unmount } = renderHook(() => useTutorVoice({ onText, onAudio: jest.fn(), onInterim }));
  await act(() => result.current.start());
  act(() => result.current.cancel());
  act(() => recognition.onresult?.({ results: [{ 0: { transcript: 'late speech' }, isFinal: true }], resultIndex: 0 }));
  expect(onText).not.toHaveBeenCalled(); expect(onInterim).not.toHaveBeenCalled();
  unmount();
});
