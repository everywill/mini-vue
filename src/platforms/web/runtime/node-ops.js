export function createElement(tagName) {
  return document.createElement(tagName);
};

export function createTextNode(content) {
  return document.createTextNode(content);
};

export function parentNode(node) {
  return node.parentNode;
};

export function nextSibling(node) {
  return node.nextSibling;
};

export function tagName(node) {
  return node.tagName;
}

export function removeChild(parent, child) {
  parent.removeChild(child);
};

export function appendChild(parent, child) {
  parent.appendChild(child);
};

export function insertBefore(parent, child, refChild) {
  parent.insertBefore(child, refChild);
};
