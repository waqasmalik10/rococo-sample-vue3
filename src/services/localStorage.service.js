export default {
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem(key) {
    localStorage.removeItem(key);
  },
  getItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  clear() {
    localStorage.clear();
  }
}
