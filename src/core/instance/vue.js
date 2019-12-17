import stateMixin from './state';
import eventMixin from './event';
import lifecycleMixin from './lifecycle';
import renderMixin from './render';
import miscMixin from './misc';

export default class Vue {
  constructor(options) {
    this.init(options);
  }

  init(options) {
    this.$options = options;
    this.$parent = options.parent;

    for (let k in options.methods) {
      this[k] = options.methods[k];
    }

    // data reactivity
    this._initProps();
    this._initState();
    this._initComputed();
    this._initEvent();

    if (options.el) {
      this.$mount(options.el);
    }
  }
}

stateMixin(Vue);
eventMixin(Vue);
lifecycleMixin(Vue);
miscMixin(Vue);
renderMixin(Vue);
