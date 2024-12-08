import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEnemies } from '../../enemy/use-enemies';
import { useEvents } from '../../event/use-events';
import { MAX_HEALTH } from '../player.consts';
import { usePlayer } from '../use-player';

const getNextWordMock = vi.fn();

describe('usePlayer', () => {
  const { health, getDeathEvent } = usePlayer();
  const { emittedEvents, emit } = useEvents();
  const { spawn } = useEnemies();

  const nextWord = '1234567890';
  beforeEach(() => {
    emittedEvents.value = [];

    mockCrypto();

    getNextWordMock.mockReturnValue(nextWord);
    vi.mock('../../glossary/use-glossary', () => ({
      useGlossary: () => ({
        getNextWord: () => getNextWordMock(),
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('health', () => {
    it("returns the proper value based on the events emitted since the last 'PLAY'", () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      let [
        {
          payload: { entity: enemy },
        },
      ] = spawn();
      emit({ type: 'HIT', payload: { source: enemy } });
      expect(health.value).toEqual(MAX_HEALTH - enemy.word.length);

      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      [
        {
          payload: { entity: enemy },
        },
      ] = spawn();
      emit({ type: 'HIT', payload: { source: enemy } });
      emit({ type: 'HIT', payload: { source: enemy } });
      emit({ type: 'HIT', payload: { target: enemy } });
      expect(health.value).toEqual(MAX_HEALTH - enemy.word.length * 2);
    });

    it('always returns a value not less than 0', () => {
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
      const [
        {
          payload: { entity: enemy },
        },
      ] = spawn();
      emit({ type: 'HIT', payload: { source: enemy } });
      expect(health.value).toEqual(MAX_HEALTH - enemy.word.length);
      emit({ type: 'HIT', payload: { source: enemy } });
      expect(health.value).toEqual(MAX_HEALTH - enemy.word.length * 2);
      emit({ type: 'HIT', payload: { source: enemy } });
      expect(health.value).toEqual(0);
      emit({ type: 'HIT', payload: { source: enemy } });
      expect(health.value).toEqual(0);
    });

    it("returns 0 while no 'PLAY' event is emitted", () => {
      expect(health.value).toEqual(0);
      emit({ type: 'PLAY' });
      expect(health.value).toEqual(MAX_HEALTH);
    });
  });

  describe('getDeathEvent', () => {
    it("returns the event that caused the player's death", () => {
      expect(getDeathEvent()).toBeUndefined();
      emit({ type: 'PLAY' });
      expect(getDeathEvent()).toBeUndefined();
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
      expect(getDeathEvent()).toBeUndefined();
      const [result] = emit({
        type: 'HIT',
        payload: {
          source: {
            id: 'enemy-1',
            word: '-'.repeat(MAX_HEALTH - 10),
            speed: 10,
          },
        },
      });
      expect(getDeathEvent()).toEqual(result);

      emit({ type: 'PLAY' });
      expect(getDeathEvent()).toBeUndefined();
    });
  });
});
