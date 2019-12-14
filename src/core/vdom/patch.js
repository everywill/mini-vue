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
    if (type === TEXT_ELEMENT) {
      vnode.elm = nodeOps.createTextNode(data.value);
      insert(parentElm, vnode.elm, refElm);
    } else {
      const { children } = data;
      vnode.elm = nodeOps.createElement(type);
      createChildren(vnode, children);
      invokeCreateHooks(vnode);    
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function createChildren(vnode, children) {
    for (let i = 0, l = children.length; i < l; i++) {
      createElm(children[i], vnode.elm);
    }
  }

  function invokeCreateHooks(vnode) {
    for (let i =0, l = cbs.create.length; i < l; i++) {
      cbs.create[i]({}, vnode);
    }
  }

  function insert(parent, elm, refElm) {
    if (refElm) {
      nodeOps.insertBefore(parent, elm, refElm);
    } else {
      nodeOps.appendChild(parent, elm);
    }
  }

  function patchNode(oldVnode, vnode) {

  }

  function updateChildren(elm, oldChildren, children) {

  }

  return function patch (oldVnode, vnode) {
    const isRealElement = !!oldVnode.nodeType;
    if (isRealElement) {
      const parentElm = nodeOps.parentNode(oldVnode);
      createElm(vnode, parentElm, nodeOps.nextSibling(oldVnode));
    }
  };
}