import { assignVoices, parseDialogue, voiceGender } from '../dialogueScript';

describe('parseDialogue', () => {
  it('splits speakers and keeps their gender and index', () => {
    const lines = parseDialogue('Woman: Hi Daniel.\nMan: Sure,\nwhat is it?\nMan 2: I can help.\nW: Thanks.');
    expect(lines).toEqual([
      { speaker: 'female-1', gender: 'female', text: 'Hi Daniel.' },
      { speaker: 'male-1', gender: 'male', text: 'Sure, what is it?' },
      { speaker: 'male-2', gender: 'male', text: 'I can help.' },
      { speaker: 'female-1', gender: 'female', text: 'Thanks.' },
    ]);
  });

  it('splits speakers written on one line and strips wrapping quotes', () => {
    expect(parseDialogue('"Man: Did you review it? Woman: Yes, it is fine."')).toEqual([
      { speaker: 'male-1', gender: 'male', text: 'Did you review it?' },
      { speaker: 'female-1', gender: 'female', text: 'Yes, it is fine.' },
    ]);
  });

  it('treats unlabeled text as one narrator and handles escaped newlines', () => {
    expect(parseDialogue('Attention passengers.\\nThe train is late.')).toEqual([
      { speaker: 'neutral-1', gender: 'neutral', text: 'Attention passengers. The train is late.' },
    ]);
    expect(parseDialogue('   ')).toEqual([]);
  });
});

describe('voiceGender', () => {
  it('does not mistake female voices for male', () => {
    expect(voiceGender({ identifier: 'x', name: 'Microsoft Aria Online (Natural) - English (United States)', language: 'en-US' })).toBe('female');
    expect(voiceGender({ identifier: 'en-us-x-iol-local', name: 'en-us-x-iol-local', language: 'en-US' })).toBe('male');
    expect(voiceGender({ identifier: 'g', name: 'Google UK English Female', language: 'en-GB' })).toBe('female');
  });
});

describe('assignVoices', () => {
  const lines = parseDialogue('Woman: A.\nMan: B.\nMan 2: C.');

  it('gives each speaker a gender-matched voice', () => {
    const voices = assignVoices(lines, [
      { identifier: 'f1', name: 'Samantha', language: 'en-US' },
      { identifier: 'm1', name: 'Daniel', language: 'en-GB' },
      { identifier: 'm2', name: 'Alex', language: 'en-US' },
      { identifier: 'vi', name: 'Linh', language: 'vi-VN' },
    ]);
    expect(voices['female-1'].voice).toBe('f1');
    expect(voices['male-1'].voice).toBe('m2');
    expect(voices['male-2'].voice).toBe('m1');
  });

  it('falls back to pitch so men and women still sound different', () => {
    const voices = assignVoices(lines, []);
    expect(voices['female-1'].pitch).toBeGreaterThan(1);
    expect(voices['male-1'].pitch).toBeLessThan(1);
    expect(voices['male-2'].pitch).not.toBe(voices['male-1'].pitch);
  });
});
