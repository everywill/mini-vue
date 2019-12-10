import Dep from './dep';
import modifyProto from './array';

class Observer {
  constructor(value) {
    this.value = value;
    Object.defineProperty(value, '__ob__', {
      configurable: false,
      enumerable: false,
      value: this,
    });
    this.dep = new Dep();
    if (Array.isArray(value)) {
      modifyProto(value);
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

export function defineReactive(obj, key, val) {
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
        if (childOb) {
          childOb.dep.depend();
        }
      }
      return val;
    },
    set: function reactiveSetter(newVal) {
      val = newVal;
      childOb = observe(val);
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
