import compile from './compile';
import Directive from './directive';
import transclude from './transclude';

export default function (Vue) {
  Vue.prototype._compile = function (el, options) {
    const original = el;
    el = transclude(el, options);
    this.$el = el;
    const linkFn = compile(el, options);
    linkFn(this);

    if (options.replace) {
      options.parent.$el.replaceChild(el, original);
    }
  }

  Vue.prototype._bindDir = function (descriptor, el) {
    this._directives.push(new Directive(descriptor, this, el));
  }
}