import { createSharedComposable, onKeyStroke } from '@vueuse/core';
import { ref } from 'vue';
import type { Keystroke } from './types';

export const useKeyboard = createSharedComposable(setup);

function setup() {
  const keystrokes = ref<Array<Keystroke>>([]);

  function getKeystrokesMatching(
    word: string,
    filterFn?: (
      element: Keystroke,
      index: number,
      array: Array<Keystroke>,
    ) => boolean,
  ) {
    let result: Array<Keystroke> = [];
    const targetKeystrokes = filterFn
      ? keystrokes.value.filter(filterFn)
      : keystrokes.value;
    const targetText = targetKeystrokes.reduce((value, keystroke) => {
      if (keystroke.key.length === 1) {
        value += keystroke.key;
      }
      return value;
    }, '');
    let matchingWord = word;
    while (matchingWord) {
      if (targetText.endsWith(matchingWord)) {
        result = targetKeystrokes.slice(-matchingWord.length);
        break;
      } else {
        matchingWord = matchingWord.slice(0, -1);
      }
    }
    return result;
  }

  onKeyStroke(
    (event) => {
      event.preventDefault();
      keystrokes.value.push({ key: event.key, timestamp: new Date() });
    },
    { dedupe: true },
  );

  return {
    keystrokes,
    getKeystrokesMatching,
  };
}
