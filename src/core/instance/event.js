import Watcher from '../observer/watcher';

export default function (Vue) {
  Vue.prototype._initEvent = function() {
    const watchers = [];
    const watch = this.$options.watch || {};
    const keys = Object.keys(watch);
    for (let i = 0, l = keys.length; i < l; i++) {
      watchers.push(new Watcher(this, keys[i], watch[keys[i]]));
    }

    return function () {
      for (let i = 0, l = watchers.length; i < l; i++) {
        watchers[i].tearDown();
      }
    }
  }
}