import parse from './parser';
import genCode from './code-gen';

export function compileToFunction (htmlString) {
  const elements = parse(htmlString);
  return genCode(elements[0]);
}