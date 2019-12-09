export default function transclude(el, options) {
  if (options.template) {
    return parseTemplate(options.template);
  }
  return el;
}

function parseTemplate(templateString) {
  const node = document.createElement('div');
  node.innerHTML = templateString;
  return node.firstChild;
}