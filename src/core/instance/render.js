import { createElement, createTextElement } from '../vdom/element'

export default function (Vue) {
  Vue.prototype._c = createElement;

  Vue.prototype._v = createTextElement;

  Vue.prototype._s = JSON.stringify.bind(JSON);

  Vue.prototype._render = function () {
    const { render } = this.$options;
    const vnode = render.call(this);

    return vnode;
  };
}