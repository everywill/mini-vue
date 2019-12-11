import Dep from './dep';

export default class Watcher {
  constructor(vm, expOfFn, cb) {
    this.vm = vm;
    this.cb = cb;
    this.deps = [];
    this.depIds = new Set();

    if (typeof expOfFn === 'function') {
      this.getter = expOfFn;
    } else {
      this.getter = function() {
        return vm.$eval(expOfFn);
      }
    }

    this.value = this.get();
  }
  addDep(dep) {
    if (!this.depIds.has(dep.id)) {
      dep.addSub(this);
      this.deps.push(dep);
      this.depIds.add(dep.id);
    }
  }
  depend() {
    for(let i = 0, l = this.deps.length; i < l; i++) {
      this.deps[i].depend();
    }
  }
  update() {
    this.run();
  }
  run() {
    const oldValue = this.value;
    const value = this.get();
    this.cb && this.cb.call(this.vm, value, oldValue);
    this.value = value;
  }
  get() {
    Dep.target = this;
    const value = this.getter.call(this.vm);
    Dep.target = null;

    return value;
  }

  tearDown() {}
}