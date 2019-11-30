import compile from './compile';
import Directive from './directive';

export default function (Vue) {
  Vue.prototype._compile = function (el) {
    const linkFn = compile(el);
    linkFn(this);
  }

  Vue.prototype._bindDir = function (descriptor) {
    this._directives.push(new Directive(descriptor, this));
  }
}