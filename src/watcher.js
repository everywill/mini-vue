import Dep from './dep';

export default class Watcher {
  constructor(vm, expOfFn, cb) {
    this.vm = vm;
    this.cb = cb;
    this.deps = [];
    this.depIds = new Set();

    this.getter = function() {
      return vm[expOfFn];
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
  update() {
    this.run();
  }
  run() {
    const oldValue = this.value;
    const value = this.get();
    if (value !== oldValue) {
      this.cb.call(this.vm, value, oldValue);
    }
  }
  get() {
    Dep.target = this;
    const value = this.getter.call(this.vm);
    Dep.target = null;

    return value;
  }
}