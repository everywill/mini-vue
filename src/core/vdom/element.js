import Watcher from '../observer/watcher';
export const TEXT_ELEMENT = 'TEXT ELEMENT';

export function createElement(type, config, ...args) {
  const data = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  data.children = rawChildren;

  if (this) {
    // context exists
    const regComponents = this.$options.components || {};
    if (regComponents.hasOwnProperty(type)) {
      return createComponent(regComponents[type], data, this);
    }
  }
  
  return { type, data, context: this };
}

function createComponent(Ctor, data, context) {
  const propsData = {};
  const propsOptions = Ctor.options.props || [];
  const { attrs = {} } = data;
  let propKey;
  for (let i = 0, l = propsOptions.length; i < l; i++) {
    propKey = propsOptions[i];
    if (attrs.hasOwnProperty(propKey)) {
      propsData[propKey] = attrs[propKey];
    } else {
      propsData[propKey] = '';
    }
  }

  return {
    type: Ctor,
    data: Object.assign({}, data, { propsData, parent: context }),
  }
}

export function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { value });
}