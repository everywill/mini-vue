import Watcher from '../watcher';
import { defineReactive } from '../observer/observe';
 
export default {
  bind() {
    const child = this.vm;
    const parent = child._context;
    const childKey = this.descriptor.prop.name;
    const parentKey = this.descriptor.prop.path;

    const parentWatcher = this.parentWatcher = new Watcher(
      parent,
      parentKey,
      function (val) {
        child[childKey] = val;
      }
    );

    defineReactive(child, childKey, parentWatcher.value);
  }
}