import { createSharedComposable } from '@vueuse/core';
import { ArrayUtils } from '../shared/utils/array.utils';
import glossary from './assets/en';

export const useGlossary = createSharedComposable(setup);

function setup() {
  let shuffledGlossary: typeof glossary | undefined;
  let nextWordIndex = 0;

  function getNextWord() {
    if (!shuffledGlossary) {
      shuffledGlossary = [...glossary.filter(word => word.length > 2)];
      ArrayUtils.shuffle(shuffledGlossary);
    }
    else if (nextWordIndex === shuffledGlossary.length) {
      ArrayUtils.shuffle(shuffledGlossary);
      nextWordIndex = 0;
    }
    return shuffledGlossary[nextWordIndex++];
  }

  return {
    glossary,
    getNextWord,
  };
}
