(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mVue = factory());
}(this, (function () { 'use strict';

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

  function dataMixin (Vue) {
    Vue.prototype.$eval = function (exp) {
      const res = parseExpression(exp);
      
      return res.call(this, this);
    };
  }

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

  class Observer {
    constructor(value) {
      this.value = value;
      if (Array.isArray(value)) {
        this.observeArray(value);
      } else {
        this.walk(value);
      }
    }

    observeArray(items) {
      for (let i = 0, l = items.length; i < l; i++) {
        observe(items[i]);
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
        }
        return val;
      },
      set: function reactiveSetter(newVal) {
        val = newVal;
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

  function stateMixin (Vue) {
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

  var dirOn = {
    bind() {
      const el = this.descriptor.el;
      if (this.descriptor.arg === 'click') {
        el.addEventListener('click', this.vm[this.descriptor.value].bind(this.vm));
      }
    }
  };

  var dirText = {
    update(value) {
      const el = this.descriptor.el;
      el.textContent = value;
    }
  };

  var dirModel = {
    bind() {
      const el = this.descriptor.el;
      el.addEventListener('input', () => {
        this.vm[this.expression] = el.value;
      });
    },
    update(value) {
      const el = this.descriptor.el;
      el.value = value;
    }
  };

  var dirDef = {
    on: dirOn,
    text: dirText,
    model: dirModel,
  };

  const dirAttrReg = /^v-([^:]+)(?:$|:(.*)$)/;

  function compile(el) {
    // compile html tags, return a link function
    if (el.hasChildNodes()) {
      return function (vm) {
        const nodeLink = compileNode(el);
        const childLink = compileNodeList(el.childNodes);
        nodeLink && nodeLink(vm);
        childLink(vm);
        vm._directives.forEach(d => d._bind());
      }
    } else {
      return function (vm) {
        const nodeLink = compileNode(el);
        nodeLink && nodeLink(vm);
        vm._directives.forEach(d => d._bind());
      }
    }
  }

  function compileNode(el) {
    return compileDirective(el, el.attributes);
  }

  function compileNodeList(nodeList) {
    const links = [];
    for (let i = 0; i < nodeList.length; i++) {
      const el = nodeList[i];
      let link = compileNode(el);
      link && links.push(link);
      if (el.hasChildNodes()) {
        link = compileNodeList(el.childNodes);
        links.push(link);
      }
    }

    return function (vm) {
      let i = links.length;
      while (i--) {
        links[i](vm);
      }
    }
  }

  function compileDirective(el, attrs) {
    if (!attrs) {
      return undefined;
    }
    const dirs = [];
    let i = attrs.length;

    while(i--) {
      const attr = attrs[i];
      const rawName = attr.name;
      const name = rawName.replace(/^@/, 'v-on:');
      const value = attr.value;
      let dirName;
      let arg;
      
      const regResult = dirAttrReg.exec(name);

      if (regResult) {
        dirName = regResult[1];
        arg = regResult[2];
        pushDir(dirName);
      }

      function pushDir(dirName) {
        dirs.push({
          el,
          def: dirDef[dirName],
          name: dirName,
          rawName,
          arg,
          value,
          rawValue: value,
          expression: value
        });
      }
    }

    if (dirs.length) {
      return makeNodeLinkFn(dirs);
    }
  }

  function makeNodeLinkFn(directives) {
    return function nodeLinkFn (vm) {
      let i = directives.length;
      while (i--) {
        vm._bindDir(directives[i]);
      }
    }
  }

  class Watcher {
    constructor(vm, expOfFn, cb) {
      this.vm = vm;
      this.cb = cb;
      this.deps = [];
      this.depIds = new Set();

      this.getter = function() {
        return vm.$eval(expOfFn);
      };
      this.value = this.get();
    }
    addDep(dep) {
      if (!this.depIds.has(dep.id)) {
        dep.addSub(this);
        this.deps.push(dep);
        this.depIds.add(dep.id);
      }
    }
    update() {
      this.run();
    }
    run() {
      const oldValue = this.value;
      const value = this.get();
      
      this.cb.call(this.vm, value, oldValue);
    }
    get() {
      Dep.target = this;
      const value = this.getter.call(this.vm);
      Dep.target = null;

      return value;
    }
  }

  function extend (to, from) {
    const keys = Object.keys(from);
    let i = keys.length;

    while (i--) {
      to[keys[i]] = from[keys[i]];
    }

    return to;
  }

  class Directive {
    constructor(descriptor, vm) {
      this.descriptor = descriptor;
      this.vm = vm;
      this.expression = descriptor.expression;
    }
    _bind() {
      const def = this.descriptor.def;

      extend(this, def);

      if (this.bind) {
        this.bind();
      }
      if (this.update) {
        const dir = this;
        this._update = function(val, oldVal) {
          dir.update(val, oldVal);
        };
      } else {
        this._update = function() {};
      }
      
      const watcher = this._watcher = new Watcher(this.vm, this.expression, this._update);
      if (this.update) {
        this.update(watcher.value);
      }
    }
  }

  function lifecycleMixin (Vue) {
    Vue.prototype._compile = function (el) {
      const linkFn = compile(el);
      linkFn(this);
    };

    Vue.prototype._bindDir = function (descriptor) {
      this._directives.push(new Directive(descriptor, this));
    };
  }

  class Vue {
    constructor(options) {
      this.init(options);
    }

    init(options) {
      this._directives = [];
      
      this.$options = options;

      const el = document.querySelector(options.el);

      for (let k in options.methods) {
        this[k] = options.methods[k];
      }

      // data reactivity
      this._initState();

      this._compile(el);
    }
  }

  dataMixin(Vue);
  stateMixin(Vue);
  lifecycleMixin(Vue);

  return Vue;

})));
