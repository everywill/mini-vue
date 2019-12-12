export default function (Vue) {
  Vue.prototype._render = function () {
    const { render } = this.$options;
    const vnode = render.call(this);

    return vnode;
  }
}