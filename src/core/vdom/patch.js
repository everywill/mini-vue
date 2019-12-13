import TEXT_ELEMENT from './element';

const hooks = ['create', 'update'];

export default function createPatch ({nodeOps, modules}) {
  
  function creatElm(vnode, parentElm, refElm) {
    const { type, data } = vnode;
    if (type === TEXT_ELEMENT) {
      vnode.elm = nodeOps.createTextNode(value);
      insert(parentElm, vnode.elm, refElm);
    } else {
      const { children, ...attrs } = data;
      vnode.elm = nodeOps.createElement(type);
      createChildren(vnode, children);

    }
  }

  function createChildren(vnode, children) {
    for (let i = 0, l = children.length; i < l; i++) {
      creatElm(children[i], vnode.elm);
    }
  }

  function insert(parent, elm, refElm) {
    if (refElm) {
      nodeOps.insertBefore(parent, elm, refElm);
    } else {
      nodeOps.appendChild(parent, elm);
    }
  }

  return function patch (oldVnode, vnode) {
    
  };
}