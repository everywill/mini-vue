import parse from './parser';
import genCode from './code-gen';

export function compileToFunction (htmlString, options) {
  const elements = parse(htmlString, options);
  return genCode(elements[0]);
}
