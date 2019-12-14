export default {
  create: updateDomListener,
  update: updateDomListener,
};

let _target;

function updateDomListener(oldVnode, vnode) {
  const elm = vnode.elm;
  const { children: oldChildren, ...oldAttrs } = oldVnode.data || {};
  const { children, ...attrs } = vnode.data;
  const ons = attrs.on || {};
  const oldOns = oldAttrs.on || {};
  let cur, old;

  _target = vnode.elm;

  for(let name in ons) {
    cur = ons[name];
    old = oldOns[name];

    if (!old) {
      cur = ons[name] = createFnInvoker(cur, vnode.context);
      _target.addEventListener(name, cur);
    } else if (cur !== old) {
      old.fn = cur;
      cur[name] = old;
    }
  }

  for(let name in oldOns) {
    if (!ons[name]) {
      _target.removeEventListener(name, oldOns[name]);
    }
  }

  _target = undefined
}

function createFnInvoker(fn, vm) {
  function invoker(...args) {
    return fn.apply(vm, ...args);
  }

  invoker.fn = fn;
  return invoker;
}
