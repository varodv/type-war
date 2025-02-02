import type { Event } from '../types';
import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEvents } from '../use-events';

describe('useEvents', () => {
  const { emittedEvents, emittedEventsSinceLastPlay, emit } = useEvents();

  let cryptoMock: ReturnType<typeof mockCrypto>;
  beforeEach(() => {
    emittedEvents.value = [];
    cryptoMock = mockCrypto();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('emittedEventsSinceLastPlay', () => {
    it('always returns the events emitted since the last "PLAY"', () => {
      expect(emittedEventsSinceLastPlay.value).toEqual([]);
      emit({ type: 'PAUSE' }, { type: 'RESUME' });
      expect(emittedEventsSinceLastPlay.value).toEqual([]);
      let result = emit({ type: 'PLAY' }, { type: 'PAUSE' });
      expect(emittedEventsSinceLastPlay.value).toEqual(result);
      result = emit({ type: 'PLAY' }, { type: 'PAUSE' }, { type: 'RESUME' });
      expect(emittedEventsSinceLastPlay.value).toEqual(result);
    });
  });

  describe('emit', () => {
    it('should store and return as emitted the passed events', () => {
      const events: Array<Event> = [
        {
          type: 'PLAY',
        },
        {
          type: 'PAUSE',
        },
        {
          type: 'RESUME',
        },
      ];
      const timestamp1 = new Date(0);
      vi.setSystemTime(timestamp1);
      const result1 = emit(events[0], events[1]);
      expect(result1).toEqual([
        {
          id: 'u-u-i-d-1',
          timestamp: timestamp1,
          ...events[0],
        },
        {
          id: 'u-u-i-d-2',
          timestamp: timestamp1,
          ...events[1],
        },
      ]);
      expect(emittedEvents.value).toEqual(result1);

      const timestamp2 = new Date(5000);
      vi.setSystemTime(timestamp2);
      const result2 = emit(events[2]);
      expect(result2).toEqual([
        {
          id: 'u-u-i-d-3',
          timestamp: timestamp2,
          ...events[2],
        },
      ]);
      expect(emittedEvents.value).toEqual([...result1, ...result2]);

      expect(cryptoMock.randomUUID).toHaveBeenCalledTimes(3);
    });
  });
});
