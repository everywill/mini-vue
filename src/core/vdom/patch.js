import { TEXT_ELEMENT } from './element';

const hooks = ['create', 'update'];

export default function createPatch ({nodeOps, modules}) {
  const cbs = {};

  for (let i = 0, l = hooks.length; i < l; i++) {
    let hoolCb = cbs[hooks[i]] = [];
    for (let j = 0, k = modules.length; j < k; j++) {
      const moduleHook = modules[j][hooks[i]];
      if (moduleHook) {
        hoolCb.push(moduleHook);
      }
    }
  }

  function createElm(vnode, parentElm, refElm) {
    const { type, data } = vnode;
    if (typeof type === 'function') {
      vnode.componentInstance = new type({ ...data });
      vnode.elm = vnode.componentInstance.$mount();
    } else if (type === TEXT_ELEMENT) {
      vnode.elm = nodeOps.createTextNode(data.value);
    } else {
      const { children } = data;
      vnode.elm = nodeOps.createElement(type);
      createChildren(vnode, children);
      invokeCreateHooks(vnode);
    }
    insert(parentElm, vnode.elm, refElm);
  }

  function createChildren(vnode, children) {
    for (let i = 0, l = children.length; i < l; i++) {
      createElm(children[i], vnode.elm);
    }
  }

  function invokeCreateHooks(vnode) {
    for (let i = 0, l = cbs.create.length; i < l; i++) {
      cbs.create[i]({}, vnode);
    }
  }

  function invokeUpdateHooks(oldVnode, vnode) {
    for (let i = 0, l = cbs.update.length; i < l; i++) {
      cbs.update[i](oldVnode, vnode);
    }
  }

  function insert(parent, elm, refElm) {
    if (refElm) {
      nodeOps.insertBefore(parent, elm, refElm);
    } else {
      nodeOps.appendChild(parent, elm);
    }
  }

  function patchVnode(oldVnode, vnode) {
    if (oldVnode === vnode) {
      return;
    }

    const elm = vnode.elm = oldVnode.elm;
    
    if (oldVnode.componentInstance) {
      vnode.componentInstance = updateChildComponent(oldVnode.componentInstance, vnode.data);
    }

    invokeUpdateHooks(oldVnode, vnode);

    const oldChildren = oldVnode.data.children;
    const children = vnode.data.children;

    updateChildren(elm, oldChildren, children);
  }

  function updateChildComponent(componentInstance, options) {
    const { propsData } = options;
    for (let key in propsData) {
      componentInstance[key] = propsData[key];
    }

    return componentInstance;
  }

  function updateChildren(elm, oldChildren, children) {
    for (let i = 0, l = children.length; i < l; i++){
      patchVnode(oldChildren[i], children[i], elm);
    }
    for (let i = children.length, l = oldChildren.length; i < l; i++) {
      patchVnode(oldChildren[i], children[i], elm);
    }
  }

  return function patch (oldVnode, vnode, contextParent) {
    let parentElm = contextParent;
    if (!vnode) {
      if (oldVnode) {
        parentElm = nodeOps.parentNode(oldVnode);
        nodeOps.removeChild(parentElm, oldVnode.elm);
      }
      return;
    }

    if (!oldVnode) {
      createElm(vnode, contextParent || this.$parent.$el);
    } else {
      const isRealElement = !!oldVnode.nodeType;
      if (isRealElement) {
        parentElm = nodeOps.parentNode(oldVnode);
        createElm(vnode, parentElm, nodeOps.nextSibling(oldVnode));
        nodeOps.removeChild(parentElm, oldVnode);
      } else if (!isRealElement && vnode.type === oldVnode.type) {
        patchVnode(oldVnode, vnode);
      }
    }

    return vnode.elm;
  };
}