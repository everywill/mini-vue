export const TEXT_ELEMENT = 'TEXT ELEMENT';

export function createElement(type, config, ...args) {
  const data = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  data.children = rawChildren;

  return { type, data };
}

export function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { value });
}