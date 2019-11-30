import observe from './observe';

export default function (Vue) {
  Vue.prototype._initState = function () {
    const dataFn = this.$options.data;
    const data = this._data = dataFn ? (typeof dataFn === 'function' ? dataFn() : dataFn) : {};

    const keys = Object.keys(data);
    let i = keys.length;
    let key;
    while (i--) {
      key = keys[i];
      this._proxy(key);
    }

    observe(data);
  }

  Vue.prototype._proxy = function (key) {
    // for the sake of extended classes
    const self = this;

    Object.defineProperties(self, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter() {
        return self._data[key];
      },
      set: function proxySetter(val) {
        self._data[key] = val;
      }
    })
  }
}