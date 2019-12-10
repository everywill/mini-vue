import observe from './observer/observe';
import Watcher from './watcher';
import Dep from './observer/dep';
import compileAndLinkProps from './compiler/compile-props';

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

  Vue.prototype._initProps = function () {
    const { props, el } = this.$options;
    if (props) {
      compileAndLinkProps(this, el, props);
    }
  }

  Vue.prototype._initComputed = function () {
    const computed = this.$options.computed;
    if (computed) {
      const keys = Object.keys(computed);
      for (let i = 0, l = keys.length; i < l; i++) {
        const userDef = computed[keys[i]];

        Object.defineProperty(this, keys[i], {
          enumerable: true,
          configurable: true,
          get: makeComputedGetter(userDef, this),
          set: function() {}
        })
      }
    }
  }

  Vue.prototype._proxy = function (key) {
    // for the sake of extended classes
    const self = this;

    Object.defineProperty(self, key, {
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

function makeComputedGetter(userDef, vm) {
  const computedWatcher = new Watcher(vm, userDef, null);

  return function computedGetter() {
    if (Dep.target) {
      computedWatcher.depend();
    }
    return computedWatcher.value;
  }
}