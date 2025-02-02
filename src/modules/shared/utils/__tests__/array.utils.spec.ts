import { ArrayUtils } from '../array.utils';

describe('ArrayUtils', () => {
  describe('shuffle', () => {
    it('changes the position of every item into the same array', () => {
      const array = Array.from({ length: 1000 });
      const arrayCopy = [...array];
      ArrayUtils.shuffle(array);
      expect(array).toHaveLength(arrayCopy.length);
      expect(array.every(item => arrayCopy.includes(item))).toBeTruthy();
      const shuffledItemsCount = array.reduce<number>((result, item, index) => {
        if (index !== arrayCopy.indexOf(item)) {
          result++;
        }
        return result;
      }, 0);
      expect(shuffledItemsCount).toEqual(array.length - 1);
    });
  });
});
