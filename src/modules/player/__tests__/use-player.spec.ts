import { mockCrypto } from '../../../__tests__/tests.utils';
import { SPEED } from '../../enemy/enemy.consts';
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
    it('returns the proper value based on the events emitted since the last \'PLAY\'', () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '1',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 1);

      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '2',
            speed: SPEED,
          },
        },
      });
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-3',
            word: '3',
            speed: SPEED,
          },
        },
      });
      emit({
        type: 'HIT',
        payload: {
          target: {
            id: 'enemy-3',
            word: '3',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 2);
    });

    it('always returns a value not less than 0', () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '1',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 1);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-2',
            word: '2',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 2);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-3',
            word: '3',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 3);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-4',
            word: '4',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(MAX_HEALTH - 4);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-5',
            word: '5',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(0);
      emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-6',
            word: '6',
            speed: SPEED,
          },
        },
      });
      expect(health.value).toEqual(0);
    });

    it('returns 0 while no \'PLAY\' event is emitted', () => {
      expect(health.value).toEqual(0);
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
    });
  });
});
