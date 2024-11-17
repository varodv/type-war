import { ArrayUtils } from '../shared/utils/array.utils';
import glossary from './assets/en';

let shuffledGlossary: typeof glossary | undefined,
  nextWordIndex = 0;
function getNextWord() {
  if (!shuffledGlossary) {
    shuffledGlossary = [...glossary];
    ArrayUtils.shuffle(shuffledGlossary);
  } else if (nextWordIndex === shuffledGlossary.length) {
    ArrayUtils.shuffle(shuffledGlossary);
    nextWordIndex = 0;
  }
  return shuffledGlossary[nextWordIndex++];
}

export function useGlossary() {
  return {
    glossary,
    getNextWord,
  };
}