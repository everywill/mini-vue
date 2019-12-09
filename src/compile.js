

import dirDef from './directives/index';

const dirAttrReg = /^v-([^:]+)(?:$|:(.*)$)/

export default function compile(el, options) {
  // compile html tags, return a link function
  if (el.hasChildNodes()) {
    return function (vm) {
      const nodeLink = compileNode(el, options);
      const childLink = compileNodeList(el.childNodes, options);
      nodeLink && nodeLink(vm);
      childLink(vm);
      vm._directives.forEach(d => d._bind());
    }
  } else {
    return function (vm) {
      const nodeLink = compileNode(el, options);
      nodeLink && nodeLink(vm);
      vm._directives.forEach(d => d._bind());
    }
  }
}

function compileNode(el, options) {
  let linkFn;

  linkFn = checkComponent(el, options);

  if (!linkFn) {
    linkFn = compileDirective(el, el.attributes);
  }
  
  return linkFn;
}

function compileNodeList(nodeList, options) {
  const links = [];
  for (let i = 0; i < nodeList.length; i++) {
    const el = nodeList[i];
    let link = compileNode(el, options);
    link && links.push(link);
    if (el.hasChildNodes()) {
      link = compileNodeList(el.childNodes, options);
      links.push(link);
    }
  }

  return function (vm) {
    let i = links.length;
    while (i--) {
      links[i](vm);
    }
  }
}

function compileDirective(el, attrs) {
  if (!attrs) {
    return undefined;
  }
  const dirs = [];
  let i = attrs.length;

  while(i--) {
    const attr = attrs[i];
    const rawName = attr.name;
    const name = rawName.replace(/^@/, 'v-on:');
    const value = attr.value;
    let dirName;
    let arg;
    
    const regResult = dirAttrReg.exec(name);

    if (regResult) {
      dirName = regResult[1];
      arg = regResult[2];
      pushDir(dirName);
    }

    function pushDir(dirName) {
      dirs.push({
        el,
        def: dirDef[dirName],
        name: dirName,
        rawName,
        arg,
        value,
        rawValue: value,
        expression: value
      });
    }
  }

  if (dirs.length) {
    return makeNodeLinkFn(dirs);
  }
}

function makeNodeLinkFn(directives) {
  return function nodeLinkFn (vm) {
    let i = directives.length;
    while (i--) {
      vm._bindDir(directives[i])
    }
  }
}

function checkComponent(el, options) {
  const components = options.components || {};
  const tagName = (el.tagName || '').toLowerCase();
  if (components[tagName]) {
    const descriptor = {
      name: 'component',
      def: dirDef.component,
      expression: tagName,
      modifier: {
        literal: true
      }
    };

    return function componentLinkFn (vm) {
      vm._bindDir(descriptor, el);
    }
  }
}