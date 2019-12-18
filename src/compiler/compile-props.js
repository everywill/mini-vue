import dirDef from '../directives/index'; 

export default function compileAndLinkProps(vm, el, props) {
  const originalDirs = vm._directives.slice();
  const propsLinkFn = compileProps(el, props, vm);
  propsLinkFn && propsLinkFn(vm);

  vm._directives.slice(originalDirs.length).forEach(d => d._bind());
  vm._directives = originalDirs;
}

function compileProps(el, optionProps, vm) {
  const props = [];
  const names = optionProps;
  let i = names.length;
  let name, path;
  while(i--) {
    name = names[i];
    path = el.getAttribute(`v-bind:${name}`) || el.getAttribute(`:${name}`);
    props.push({
      name,
      path
    })
  }
  return makePropsLinkFn(props);
}

function makePropsLinkFn(props) {
  return function propsLinkFn (vm) {
    let i = props.length;
    let prop, name, path;
    while(i--) {
      prop = props[i];
      vm._bindDir({
        name: 'prop',
        def: dirDef.prop,
        prop,
      })
    }
  }
}