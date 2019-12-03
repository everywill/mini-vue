function parseExpression(exp) {
  const reg = /^([^\[]*)(\[.*)?/;
  const regResult = reg.exec(exp);
  let prefix = '', suffix = '';
  if (regResult) {
    prefix = `.${regResult[1]}` || '';
    suffix = regResult[2] || '';
  }
  
  return new Function('vm', 'with(vm) { return ' + exp + ';}');
}

export default function (Vue) {
  Vue.prototype.$eval = function (exp) {
    const res = parseExpression(exp);
    
    return res.call(this, this);
  }
};
