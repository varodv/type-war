import { usePosition } from '../use-position';

const randomMock = vi.fn();

describe('usePosition', () => {
  const { getRandomPosition } = usePosition();

  describe('getRandomPosition', () => {
    const mathMock = Object.create(Math) as typeof Math;
    mathMock.random = randomMock;
    beforeEach(() => {
      vi.stubGlobal('Math', mathMock);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns a random point at x:0 half the time', () => {
      randomMock.mockReturnValue(0.49);
      expect(getRandomPosition()).toEqual([-50, -1]);
      expect(mathMock.random).toHaveBeenCalledTimes(2);
    });

    it('returns a random point at x:100 half the time', () => {
      randomMock.mockReturnValue(0.5);
      expect(getRandomPosition()).toEqual([50, 0]);
      expect(mathMock.random).toHaveBeenCalledTimes(2);
    });
  });
});
