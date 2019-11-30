import Dep from './dep';

class Observer {
  constructor(value) {
    this.value = value;

    this.walk(value);
  }

  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0, l = keys.length; i < l; i++) {
      this.convert(keys[i], obj[keys[i]]);
    }
  }

  convert(key, val) {
    defineReactive(this.value, key, val);
  }
}

function defineReactive(obj, key, val) {
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

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

export default function(data) {
  const ob = new Observer(data);
}