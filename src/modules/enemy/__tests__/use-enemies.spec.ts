import type { Enemy } from '../../enemy/types';
import type { Emitted, SpawnEvent } from '../../event/types';
import type { Position } from '../../position/types';
import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEvents } from '../../event/use-events';
import { SPEED } from '../enemy.consts';
import { useEnemies } from '../use-enemies';

const getNextWordMock = vi.fn<() => string>();
const getRandomPositionMock = vi.fn<() => Position>();

describe('useEnemies', () => {
  const { enemies, spawn } = useEnemies();
  const { emittedEvents, emit } = useEvents();

  const nextWord = 'testing';
  const randomPosition: Position = [50, 0];
  const timestamp = new Date(0);
  let cryptoMock: ReturnType<typeof mockCrypto>;
  beforeEach(() => {
    emittedEvents.value = [];

    cryptoMock = mockCrypto();

    getNextWordMock.mockReturnValue(nextWord);
    vi.mock('../../glossary/use-glossary', () => ({
      useGlossary: () => ({
        getNextWord: () => getNextWordMock(),
      }),
    }));

    getRandomPositionMock.mockReturnValue(randomPosition);
    vi.mock('../../position/use-position', () => ({
      usePosition: () => ({
        getRandomPosition: () => getRandomPositionMock(),
      }),
    }));

    vi.useFakeTimers();
    vi.setSystemTime(timestamp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('enemies', () => {
    it('contains all the enemies spawned since the last \'PLAY\' event', () => {
      const expected: Array<Enemy> = [];
      const quantity = 5;
      for (let i = 0; i < quantity; i++) {
        expected.push({
          id: `u-u-i-d-${i + 10}`,
          word: nextWord,
          speed: SPEED,
        });
      }
      emit({ type: 'PLAY' });
      spawn();
      emit({ type: 'PLAY' });
      spawn(2);
      emit({ type: 'PLAY' });
      spawn(quantity);
      expect(enemies.value).toEqual(expected);
    });

    it('is empty while no \'PLAY\' event is emitted', () => {
      expect(enemies.value).toHaveLength(0);
      spawn();
      expect(enemies.value).toHaveLength(0);
      emit({ type: 'PLAY' });
      spawn();
      expect(enemies.value).toHaveLength(1);
    });
  });

  describe('spawn', () => {
    it('creates the required enemies in random positions', () => {
      const expected: Array<Emitted<SpawnEvent>> = [];
      const quantity = 5;
      for (let i = 0; i < quantity; i++) {
        expected.push({
          id: `u-u-i-d-${quantity + i + 1}`,
          timestamp,
          type: 'SPAWN',
          payload: {
            entity: {
              id: `u-u-i-d-${i + 1}`,
              word: nextWord,
              speed: SPEED,
            },
            position: randomPosition,
          },
        });
      }
      const result = spawn(quantity);
      expect(result).toEqual(expected);
      expect(cryptoMock.randomUUID).toHaveBeenCalledTimes(quantity * 2);
      expect(getNextWordMock).toHaveBeenCalledTimes(quantity);
      expect(getRandomPositionMock).toHaveBeenCalledTimes(quantity);
    });
  });
});
