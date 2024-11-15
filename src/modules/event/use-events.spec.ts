import { mockCrypto } from '../../__tests__/tests.utils';
import type { Event } from './types';
import { useEvents } from './use-events';

describe('useEvents', () => {
  const { emittedEvents, emit } = useEvents();

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

  describe('emit', () => {
    it('should store and return as emitted the passed events', () => {
      const events: Array<Event> = [
        {
          type: 'PLAY',
        },
        {
          type: 'SPAWN',
          payload: {
            entity: {
              id: 'enemy-1',
              word: 'testing',
            },
            position: [0, 0],
          },
        },
        {
          type: 'HIT',
          payload: {
            source: {
              id: 'enemy-1',
              word: 'testing',
            },
          },
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
