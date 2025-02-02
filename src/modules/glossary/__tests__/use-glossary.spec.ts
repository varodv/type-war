import { ArrayUtils } from '../../shared/utils/array.utils';
import glossary from '../assets/en';
import { useGlossary } from '../use-glossary';

describe('useGlossary', () => {
  describe('glossary', () => {
    it('returns the proper glossary', () => {
      expect(useGlossary().glossary).toEqual(glossary);
    });
  });

  describe('getNextWord', () => {
    let shuffleArrayMock: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      shuffleArrayMock = vi.spyOn(ArrayUtils, 'shuffle');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns a random and not repeteated word from the glossary every time while possible', () => {
      const result: typeof glossary = [];
      glossary
        .filter(word => word.length > 2)
        .forEach(() => {
          const word = useGlossary().getNextWord();
          expect(word.length).toBeGreaterThan(2);
          expect(glossary).includes(word);
          expect(result).not.includes(word);
          result.push(word);
        }, []);
      expect(shuffleArrayMock).toHaveBeenCalledOnce();
      const word = useGlossary().getNextWord();
      expect(glossary).includes(word);
      expect(result).includes(word);
    });
  });
});
