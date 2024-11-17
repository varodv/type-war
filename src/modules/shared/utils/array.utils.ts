export class ArrayUtils {
  static shuffle(array: Array<unknown>) {
    for (
      let currentIndex = array.length - 1;
      currentIndex > 0;
      currentIndex--
    ) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
  }
}
