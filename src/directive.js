import Watcher from './watcher';

function extend (to, from) {
  const keys = Object.keys(from);
  let i = keys.length;

  while (i--) {
    to[keys[i]] = from[keys[i]];
  }

  return to;
}

export default class Directive {
  constructor(descriptor, vm) {
    this.descriptor = descriptor;
    this.vm = vm;
    this.expression = descriptor.expression;
  }
  _bind() {
    const def = this.descriptor.def;

    extend(this, def);

    if (this.bind) {
      this.bind();
    }
    if (this.update) {
      const dir = this;
      this._update = function(val, oldVal) {
        dir.update(val, oldVal);
      };
    } else {
      this._update = function() {};
    }
    
    const watcher = this._watcher = new Watcher(this.vm, this.expression, this._update);
    if (this.update) {
      this.update(watcher.value);
    }
  }
}