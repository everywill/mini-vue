import Dep from './dep';

class Observer {
  constructor(value) {
    this.value = value;
    if (Array.isArray(value)) {
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      defineReactive(this.value, i, items[i]);
    }
  }

  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0, l = keys.length; i < l; i++) {
      defineReactive(this.value, keys[i], obj[keys[i]]);
    }
  }
}

function defineReactive(obj, key, val) {
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

  let childOb = observe(val);

  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get: function reactiveGetter() {
      if (Dep.target) {
        dep.depend();
      }
      return val;
    },
    set: function reactiveSetter(newVal) {
      val = newVal;
      dep.notify();
    }
  });
}

export default function observe(data) {
  if (typeof data !== 'object') {
    return;
  }
  const ob = new Observer(data);
  return ob;
}
