import tagParser from './tag-parser';

const domParserTokenizer = /<[a-zA-Z\-\!\/](?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])*>/gm;

export default function parse(htmlString, options = {}) {
  const registeredComp = options.components || {};
  const result = [];
  const levelParent = [];
  let level = -1;


  htmlString.replace(domParserTokenizer, function (tag, index) {
    // tag example: </div>
    const isClose = tag.charAt(1) === '/'; 
    const contentStart = index + tag.length;
    const nextChar = htmlString.charAt(contentStart);
    
    if (isClose) {
      level --;
    } else {
      level ++;
      current = tagParser(tag);

      if (nextChar && nextChar !== '<') {
        current.children.push({
          type: 'text',
          content: htmlString.slice(contentStart, htmlString.indexOf('<', contentStart))
        })
      }

      if (level === 0) {
        result.push(current);
      }

      const parent = levelParent[level - 1];
      if (parent) {
        parent.children.push(current);
      }

      levelParent[level] = current;
    }

  })
  
  return result;
}