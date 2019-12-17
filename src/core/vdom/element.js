export const TEXT_ELEMENT = 'TEXT ELEMENT';

export function createElement(type, config, ...args) {
  const data = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  data.children = rawChildren;

  const regComponents = this.$options.components || {};
  if (regComponents.hasOwnProperty(type)) {
    return createComponent(regComponents[type], data, context);
  }

  return { type, data, context: this };
}

function createComponent(Ctor, data, context) {
  
}

export function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { value });
}