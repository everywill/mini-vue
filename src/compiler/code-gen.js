export default function genCode(element) {
  return new Function(`with(this) {return ${genElement(element)}}`);
}

function genElement(element) {
  if (element.type === 'tag') {
    return `_c('${genType(element)}', {${genConfig(element)}}, [${genChildren(element)}])`;
  } else if (element.type === 'text') {
    return `_v('${element.content}')`;
  }
}

function genType(element) {
  return element.name;
}

function genConfig(element) {
  const dirAttrReg = /^v-([^:]+)(?:$|:(.*)$)/;
  const rawAttrs = element.attrs
  const names = Object.keys(rawAttrs);
  const attrs = [];
  const domProps = [];
  const ons = [];
  const result = [];

  for (let i = 0, l = names.length; i < l; i++) {
    let name = names[i];
    let value = rawAttrs[name];
    
    const regResult = dirAttrReg.exec(name);

    if (regResult) {
      if (regResult[1] === 'on') {
        ons.push({
          name: `${regResult[2]}`,
          value,
        });
      }
      if (regResult[1] === 'text') {
        domProps.push({
          name: 'textContent',
          value: `_s(${value})`,
        });
      }
      if (regResult[1] === 'bind') {
        attrs.push({
          name: `${regResult[2]}`,
          value,
        });
      }
    } else {
      attrs.push({
        name,
        value: `'${value}'`,
      });
    }
  }

  if (attrs.length) {
    result.push(`attrs:{${attrs.map(attr => attr.name + ':' + attr.value).join(',')}}`);
  }

  if (domProps.length) {
    result.push(`domProps:{${domProps.map(domProp => domProp.name + ':' + domProp.value).join(',')}}`);
  }

  if (ons.length) {
    result.push(`on:{${ons.map(on => on.name + ':' + on.value).join(',')}}`);
  }

  return result.join(',');
}

function genChildren(element) {
  const children = element.children;
  return children.map(child => genElement(child)).join(',');
}