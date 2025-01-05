import { stroke } from '../../../__tests__/tests.utils';
import type { Keystroke } from '../types';
import { useKeyboard } from '../use-keyboard';

describe('useKeyboard', () => {
  const { keystrokes, getKeystrokesMatching } = useKeyboard();

  beforeEach(() => {
    keystrokes.value = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('keystrokes', () => {
    it('stores each keystroke with its specific timestamp', () => {
      expect(keystrokes.value).toEqual([]);

      const timestamp1 = new Date(0);
      vi.setSystemTime(timestamp1);
      stroke('a', 'b');
      expect(keystrokes.value).toEqual([
        {
          key: 'a',
          timestamp: timestamp1,
        },
        {
          key: 'b',
          timestamp: timestamp1,
        },
      ]);

      const timestamp2 = new Date(0);
      vi.setSystemTime(timestamp2);
      stroke('c', 'd', { key: 'd', repeat: true }, 'Escape');
      expect(keystrokes.value).toEqual([
        {
          key: 'a',
          timestamp: timestamp1,
        },
        {
          key: 'b',
          timestamp: timestamp1,
        },
        {
          key: 'c',
          timestamp: timestamp2,
        },
        {
          key: 'd',
          timestamp: timestamp2,
        },
        {
          key: 'Escape',
          timestamp: timestamp2,
        },
      ]);
    });
  });

  describe('getKeystrokesMatching', () => {
    it('returns the keystrokes (if) matching the given word', () => {
      const timestamp = new Date(0);
      vi.setSystemTime(timestamp);
      stroke('r', 'u', 'n', 'n', 'i', 'n', 'g', ' ', 't', 'e', 's', 't');
      expect(getKeystrokesMatching('test')).toEqual([
        {
          key: 't',
          timestamp,
        },
        {
          key: 'e',
          timestamp,
        },
        {
          key: 's',
          timestamp,
        },
        {
          key: 't',
          timestamp,
        },
      ]);
      expect(getKeystrokesMatching('testing')).toEqual([
        {
          key: 't',
          timestamp,
        },
        {
          key: 'e',
          timestamp,
        },
        {
          key: 's',
          timestamp,
        },
        {
          key: 't',
          timestamp,
        },
      ]);
      expect(getKeystrokesMatching('running')).toEqual([]);
      expect(getKeystrokesMatching('rest')).toEqual([]);
    });
  });

  it('applies the given filter to match the word', () => {
    stroke('t', 'e', 's', 't');
    expect(getKeystrokesMatching('test')).toHaveLength(4);
    expect(
      getKeystrokesMatching(
        'test',
        (element: Keystroke) => element.key !== 't',
      ),
    ).toHaveLength(0);
    expect(
      getKeystrokesMatching(
        'test',
        (_element: Keystroke, index: number, array: Array<Keystroke>) =>
          index < array.length - 1,
      ),
    ).toHaveLength(3);
  });
});
