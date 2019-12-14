export default {
  create: updateDomProps,
  update: updateDomProps,
};

function updateDomProps(oldVnode, vnode) {
  const elm = vnode.elm;
  const { children: oldChildren, ...oldAttrs } = oldVnode.data || {};
  const { children, ...attrs } = vnode.data;
  const domProps = attrs.domProps || {};
  const oldDomProps = oldAttrs.domProps || {};

  for (let key in oldDomProps) {
    if (domProps.hasOwnProperty(key)) {
      elm[key] = null;
    }
  }

  for (let key in domProps) {
    elm[key] = domProps[key];
  }
}
