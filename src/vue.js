import stateMixin from './state';
import lifecycleMixin from './lifecycle';

export default class Vue {
  constructor(options) {
    this.init(options);
    this._directives = [];
  }

  init(options) {
    this.$options = options;

    for (let k in options.methods) {
      this[k] = options.methods[k];
    }

    // data reactivity
    this._initState();

    this._compile(el);
  }
}

stateMixin(Vue);
lifecycleMixin(Vue);
