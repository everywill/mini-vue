import Watcher from '../observer/watcher';

export default function (Vue) {
  Vue.prototype._update = function (vnode) {}
}

export function mountComponent(vm, el) {
  const updateComponent = () => {
    vm._update(vm._render());
  }

  new Watcher(vm, updateComponent);

  return vm;
}