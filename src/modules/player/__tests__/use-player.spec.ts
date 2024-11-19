import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEnemies } from '../../enemy/use-enemies';
import { useEvents } from '../../event/use-events';
import { usePlayer } from '../use-player';

const getNextWordMock = vi.fn();
describe('usePlayer', () => {
  const { MAX_HEALTH, health } = usePlayer();
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
    it("returns the proper value based on the events emitted after the last 'PLAY'", () => {
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
  });
});
