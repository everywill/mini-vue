const attrReg = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;

export default function tagParser(tag) {
  const result = {
    type: 'tag',
    name: '',
    attrs: {},
    children: []
  };

  const tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);

  if (tagMatch) {
    result.name = tagMatch[1];
  }

  let attrRegResult;
  while(true) {
    attrRegResult = attrReg.exec(tag);

    if (!attrRegResult) {
      break;
    }

    if (attrRegResult[1]) {
      let attr = attrRegResult[1].trim();
      result.attrs[attr] = true;
    }

    if (attrRegResult[2]) {
      let attr = attrRegResult[2].trim();
      let value = attrRegResult[3].trim();
      result.attrs[attr] = value;
    }
  }

  return result;
}