import { usePosition } from '../use-position';

describe('usePosition', () => {
  const { getRandomPosition } = usePosition();

  describe('getRandomPosition', () => {
    const mathMock = Object.create(Math);
    mathMock.random = vi.fn();
    beforeEach(() => {
      vi.stubGlobal('Math', mathMock);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns a random point at x:0 half the time', () => {
      mathMock.random.mockReturnValue(0.4999);
      expect(getRandomPosition()).toEqual([0, 49.99]);
      expect(mathMock.random).toHaveBeenCalledTimes(2);
    });

    it('returns a random point at x:100 half the time', () => {
      mathMock.random.mockReturnValue(0.5);
      expect(getRandomPosition()).toEqual([100, 50]);
      expect(mathMock.random).toHaveBeenCalledTimes(2);
    });
  });
});
