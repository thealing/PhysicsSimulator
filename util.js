class Util {
  static clamp(x, l, u) {
    return Math.min(Math.max(x, l), u);
  }

  static cloneArray(array) {
    return array.map((item) => item.clone());
  }
}
