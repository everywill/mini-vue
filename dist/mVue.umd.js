(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mVue = factory());
}(this, (function () { 'use strict';

  let uid = 0;

  class Dep {
    constructor() {
      this.id = uid++;
      // watchers subscribing to this dep;
      this.subs = [];
    }
    depend() {
      Dep.target.addDep(this);
    }
    addSub(sub) {
      this.subs.push(sub);
    }
    notify() {
      const subs = this.subs;
      for (let i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
      }
    }
  }

  Dep.target = null;

  const proto = Array.prototype;
  const mutatorMethods = [
    'pop',
    'push',
    'reverse',
    'shift',
    'unshift',
    'splice',
    'sort'
  ];

  function modifyProto(arr) {
    mutatorMethods.forEach(function (method) {
      arr[method] = function (...args) {
        proto[method].apply(this, args);
        const ob = this.__ob__;
        ob.dep.notify();
      };
    });
  }

  class Observer {
    constructor(value) {
      this.value = value;
      Object.defineProperty(value, '__ob__', {
        configurable: false,
        enumerable: false,
        value: this,
      });
      this.dep = new Dep();
      if (Array.isArray(value)) {
        modifyProto(value);
        this.observeArray(value);
      } else {
        this.walk(value);
      }
    }

    observeArray(items) {
      for (let i = 0, l = items.length; i < l; i++) {
        defineReactive(this.value, i, items[i]);
      }
    }

    walk(obj) {
      const keys = Object.keys(obj);
      for (let i = 0, l = keys.length; i < l; i++) {
        defineReactive(this.value, keys[i], obj[keys[i]]);
      }
    }
  }

  function defineReactive(obj, key, val) {
    const dep = new Dep();

    const property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return;
    }

    let childOb = observe(val);

    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: true,
      get: function reactiveGetter() {
        if (Dep.target) {
          dep.depend();
          if (childOb) {
            childOb.dep.depend();
          }
        }
        return val;
      },
      set: function reactiveSetter(newVal) {
        val = newVal;
        childOb = observe(val);
        dep.notify();
      }
    });
  }

  function observe(data) {
    if (typeof data !== 'object') {
      return;
    }
    const ob = new Observer(data);
    return ob;
  }

  class Watcher {
    constructor(vm, expOfFn, cb) {
      this.vm = vm;
      this.cb = cb;
      this.deps = [];
      this.depIds = new Set();

      if (typeof expOfFn === 'function') {
        this.getter = expOfFn;
      } else {
        this.getter = function() {
          return vm.$eval(expOfFn);
        };
      }

      this.value = this.get();
    }
    addDep(dep) {
      if (!this.depIds.has(dep.id)) {
        dep.addSub(this);
        this.deps.push(dep);
        this.depIds.add(dep.id);
      }
    }
    depend() {
      for(let i = 0, l = this.deps.length; i < l; i++) {
        this.deps[i].depend();
      }
    }
    update() {
      this.run();
    }
    run() {
      const oldValue = this.value;
      const value = this.get();
      this.cb && this.cb.call(this.vm, value, oldValue);
      this.value = value;
    }
    get() {
      Dep.target = this;
      const value = this.getter.call(this.vm);
      Dep.target = null;

      return value;
    }

    tearDown() {}
  }

  function stateMixin (Vue) {
    Vue.prototype._initProps = function () {
      
    };

    Vue.prototype._initState = function () {
      const dataFn = this.$options.data;
      const data = this._data = dataFn ? (typeof dataFn === 'function' ? dataFn() : dataFn) : {};

      const keys = Object.keys(data);
      let i = keys.length;
      let key;
      while (i--) {
        key = keys[i];
        this._proxy(key);
      }

      observe(data);
    };

    Vue.prototype._initComputed = function () {
      const computed = this.$options.computed;
      if (computed) {
        const keys = Object.keys(computed);
        for (let i = 0, l = keys.length; i < l; i++) {
          const userDef = computed[keys[i]];

          Object.defineProperty(this, keys[i], {
            enumerable: true,
            configurable: true,
            get: makeComputedGetter(userDef, this),
            set: function() {}
          });
        }
      }
    };

    Vue.prototype._proxy = function (key) {
      // for the sake of extended classes
      const self = this;

      Object.defineProperty(self, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter() {
          return self._data[key];
        },
        set: function proxySetter(val) {
          self._data[key] = val;
        }
      });
    };
  }

  function makeComputedGetter(userDef, vm) {
    const computedWatcher = new Watcher(vm, userDef, null);

    return function computedGetter() {
      if (Dep.target) {
        computedWatcher.depend();
      }
      return computedWatcher.value;
    }
  }

  function eventMixin (Vue) {
    Vue.prototype._initEvent = function() {
      const watchers = [];
      const watch = this.$options.watch || {};
      const keys = Object.keys(watch);
      for (let i = 0, l = keys.length; i < l; i++) {
        watchers.push(new Watcher(this, keys[i], watch[keys[i]]));
      }

      return function () {
        for (let i = 0, l = watchers.length; i < l; i++) {
          watchers[i].tearDown();
        }
      }
    };
  }

  function lifecycleMixin (Vue) {
    Vue.prototype._update = function (vnode) {
      const prevVnode = this._vnode;
      this._vnode = prevVnode;
      
      this.__patch__(prevVnode, vnode);
    };
  }

  function mountComponent(vm, el) {
    const updateComponent = () => {
      vm._update(vm._render());
    };

    new Watcher(vm, updateComponent);

    return vm;
  }

  const TEXT_ELEMENT = 'TEXT ELEMENT';

  function createElement(type, config, ...args) {
    const props = Object.assign({}, config);
    const hasChildren = args.length > 0;
    const rawChildren = hasChildren ? [].concat(...args) : [];
    props.children = rawChildren;

    return { type, props };
  }

  function createTextElement(value) {
    return createElement(TEXT_ELEMENT, { textContent: value });
  }

  function renderMixin (Vue) {
    Vue.prototype._c = createElement;

    Vue.prototype._v = createTextElement;

    Vue.prototype._s = JSON.stringify.bind(JSON);

    Vue.prototype._render = function () {
      const { render } = this.$options;
      const vnode = render.call(this);

      return vnode;
    };
  }

  function parseExpression(exp) {  
    return new Function('vm', 'with(vm) { return ' + exp + ';}');
  }

  function miscMixin (Vue) {
    Vue.prototype.$eval = function (exp) {
      const res = parseExpression(exp);
      
      return res.call(this, this);
    };

    Vue.prototype._resolveComponent = function (id) {
      const components = this.$options.components;
      return components[id];
    };

    Vue.extend = function (extendOptions) {
      return class extends Vue {
        constructor(options) {
          options = Object.assign({}, options, extendOptions);
          super(options);
        }
      }
    };
  }

  class Vue {
    constructor(options) {
      this.init(options);
    }

    init(options) {
      this.$options = options;

      for (let k in options.methods) {
        this[k] = options.methods[k];
      }

      // data reactivity
      this._initProps();
      this._initState();
      this._initComputed();
      this._initEvent();

      if (options.el) {
        this.$mount(options.el);
      }
    }
  }

  stateMixin(Vue);
  eventMixin(Vue);
  lifecycleMixin(Vue);
  miscMixin(Vue);
  renderMixin(Vue);

  const attrReg = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;

  function tagParser(tag) {
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
        let value = attrRegResult[3].trim().substring(1, attrRegResult[3].length - 1);
        result.attrs[attr] = value;
      }
    }

    return result;
  }

  const domParserTokenizer = /<[a-zA-Z\-\!\/](?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])*>/gm;

  function parse(htmlString, options = {}) {
    const registeredComp = options.components || {};
    const result = [];
    const levelParent = [];
    let level = -1;
    let current;

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
            content: htmlString.slice(contentStart, htmlString.indexOf('<', contentStart)).trim(),
          });
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

    });
    
    return result;
  }

  function genCode(element) {
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
    const rawAttrs = element.attrs;
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

  function compileToFunction (htmlString) {
    const elements = parse(htmlString);
    return genCode(elements[0]);
  }

  function createPatch ({nodeOps}) {
    return function patch (oldVnode, vnode) {
      
    };
  }

  var nodeOps = {
    
  };

  const patch = createPatch({nodeOps});

  Vue.prototype.__patch__ = patch;

  Vue.prototype.$mount = function (el) {
    if (typeof el === 'string') {
      el = document.querySelector(el);
    }

    const options = this.$options;
    if (!options.render) {
      let template = options.template;
      // only take into account the situation template is kind of html string
      if (!template) {
        template = el.outerHTML;
      }

      options.render = compileToFunction(template);
    }

    return mountComponent(this);
  };

  return Vue;

})));
