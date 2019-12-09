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
  constructor(descriptor, vm, el) {
    this.descriptor = descriptor;
    this.vm = vm;
    this.el = el;
    this.expression = descriptor.expression;
    this.literal = descriptor.modifier && descriptor.modifier.literal;
  }
  _bind() {
    const def = this.descriptor.def;

    extend(this, def);

    if (this.bind) {
      this.bind();
    }

    if (this.literal) {
      // skip updating 
      return;
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
      this._update(watcher.value);
    }
  }
}