import { computed, ref } from 'vue';
import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEvents } from '../../event/use-events';
import { useGame } from '../use-game';

const now = ref(new Date());

describe('useGame', () => {
  const { time, paused, play, pause, resume } = useGame();
  const { emittedEvents } = useEvents();

  beforeEach(() => {
    emittedEvents.value = [];
    mockCrypto();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('time', () => {
    beforeEach(() => {
      setTime(0);
      vi.mock('@vueuse/core', () => ({
        useNow: () => computed(() => now.value),
      }));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function setTime(milliseconds: number): void {
      now.value = new Date(milliseconds);
      vi.setSystemTime(now.value);
    }

    function advanceTime(milliseconds: number): void {
      setTime(now.value.getTime() + milliseconds);
    }

    it('returns the last game time excluding all the pauses', () => {
      expect(time.value).toEqual(0);
      play();
      const interval = 5000;
      advanceTime(interval);
      expect(time.value).toEqual(interval);
      pause();
      advanceTime(interval);
      expect(time.value).toEqual(interval);
      resume();
      advanceTime(interval);
      expect(time.value).toEqual(interval * 2);
      play();
      expect(time.value).toEqual(0);
    });
  });

  describe('paused', () => {
    it('returns the proper pause status on every scenario', () => {
      expect(paused.value).toBeFalsy();
      play();
      expect(paused.value).toBeFalsy();
      pause();
      expect(paused.value).toBeTruthy();
      resume();
      expect(paused.value).toBeFalsy();
      pause();
      expect(paused.value).toBeTruthy();
      play();
      expect(paused.value).toBeFalsy();
    });
  });

  describe('play', () => {
    it("emits and returns a 'PLAY' event", () => {
      expect(play()).toEqual(emittedEvents.value);
    });
  });

  describe('pause', () => {
    it("emits and returns a 'PAUSE' event if the game is in progress", () => {
      play();
      expect(pause()).toEqual([emittedEvents.value[1]]);
    });

    it('throws an error if the game is not in progress', () => {
      expect(() => pause()).toThrowError('The game is not in progress');
    });

    it('throws an error if the game is already paused', () => {
      play();
      expect(pause()).toEqual([emittedEvents.value[1]]);
      expect(() => pause()).toThrowError('The game is already paused');
    });
  });

  describe('resume', () => {
    it("emits and returns a 'RESUME' event if the game is paused", () => {
      play();
      pause();
      expect(resume()).toEqual([emittedEvents.value[2]]);
    });

    it('throws an error if the game is not in progress', () => {
      expect(() => resume()).toThrowError('The game is not in progress');
    });

    it('throws an error if the game is already resumed', () => {
      play();
      expect(() => resume()).toThrowError('The game is already resumed');
      pause();
      expect(resume()).toEqual([emittedEvents.value[2]]);
      expect(() => resume()).toThrowError('The game is already resumed');
    });
  });
});
