function parseExpression(exp) {  
  return new Function('vm', 'with(vm) { return ' + exp + ';}');
}

export default function (Vue) {
  Vue.prototype.$eval = function (exp) {
    const res = parseExpression(exp);
    
    return res.call(this, this);
  }

  Vue.prototype._resolveComponent = function (id) {
    const components = this.$options.components;
    return components[id];
  }

  Vue.extend = function (extendOptions = {}) {
    const cls = class extends Vue {
      constructor(options) {
        options = Object.assign({}, options, extendOptions);
        super(options);
      }
    }

    cls.options = extendOptions;

    return cls;
  }
};
