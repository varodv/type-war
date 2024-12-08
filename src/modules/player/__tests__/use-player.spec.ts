import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEvents } from '../../event/use-events';
import { MAX_HEALTH } from '../player.consts';
import { usePlayer } from '../use-player';

describe('usePlayer', () => {
  const { health } = usePlayer();
  const { emittedEvents, emit } = useEvents();

  beforeEach(() => {
    emittedEvents.value = [];

    mockCrypto();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('health', () => {
    it("returns the proper value based on the events emitted since the last 'PLAY'", () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 10);

      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-3',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      emit({
        type: 'HIT',
        payload: {
          target: {
            id: 'enemy-3',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 20);
    });

    it('always returns a value not less than 0', () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 10);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 20);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-3',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(0);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-4',
            word: '-'.repeat(10),
            speed: 10,
          },
        },
      });
      expect(health.value).toEqual(0);
    });

    it("returns 0 while no 'PLAY' event is emitted", () => {
      expect(health.value).toEqual(0);
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
    });
  });
});
