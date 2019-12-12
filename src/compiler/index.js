import parse from './parser';

export function compileToFunction (htmlString) {
  const elements = parse(htmlString);
  return new Function()
}