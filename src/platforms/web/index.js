import stateMixin from './state';
import eventMixin from './event';
import lifecycleMixin from './lifecycle';
import miscMixin from './misc';

export default class Vue {
  constructor(options) {
    this.init(options);
  }

  init(options) {
    
    this.$options = options;
    this._context = options.parent;

    let el = options.el;
    if (typeof el === 'string') {
      el = document.querySelector(options.el)
    }

    for (let k in options.methods) {
      this[k] = options.methods[k];
    }

    // data reactivity
    this._initProps();
    this._initState();
    this._initComputed();
    this._initEvent();

    this._compile(el, options);
  }
}

stateMixin(Vue);
eventMixin(Vue);
lifecycleMixin(Vue);
miscMixin(Vue);
