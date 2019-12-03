function parseExpression(exp) {  
  return new Function('vm', 'with(vm) { return ' + exp + ';}');
}

export default function (Vue) {
  Vue.prototype.$eval = function (exp) {
    const res = parseExpression(exp);
    
    return res.call(this, this);
  }
};
