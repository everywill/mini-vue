import Watcher from '../observer/watcher';

export default function (Vue) {
  Vue.prototype._update = function (vnode) {
    const prevVnode = this._vnode;
    this._vnode = vnode;
    if (prevVnode) {
      this.$el = this.__patch__(prevVnode, vnode);
    } else {
      this.$el = this.__patch__(this.$el, vnode);
    }
  }
}

export function mountComponent(vm, el) {
  const updateComponent = () => {
    vm._update(vm._render());
  }

  new Watcher(vm, updateComponent);

  return vm.$el;
}