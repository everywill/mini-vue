import dataMixin from './data';
import stateMixin from './state';
import eventMixin from './event';
import lifecycleMixin from './lifecycle';

export default class Vue {
  constructor(options) {
    this.init(options);
  }

  init(options) {
    this._directives = [];
    
    this.$options = options;

    const el = document.querySelector(options.el);

    for (let k in options.methods) {
      this[k] = options.methods[k];
    }

    // data reactivity
    this._initState();
    this._initComputed();
    this._initEvent();

    this._compile(el);
  }
}

dataMixin(Vue);
stateMixin(Vue);
eventMixin(Vue);
lifecycleMixin(Vue);
