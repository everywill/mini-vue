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

  var component = {
    bind() {
      this.setComponent(this.expression);
    },

    update() {},

    setComponent(id) {
      this.Component = this.vm._resolveComponent(id);
      this.mountComponent();
    },

    mountComponent() {
      const newComponent = new this.Component({
        replace: true,
        parent: this.vm,
        el: this.el
      });
    }
  };

  var prop = {
    bind() {
      const child = this.vm;
      const parent = child._context;
      const childKey = this.descriptor.prop.name;
      const parentKey = this.descriptor.prop.path;

      const parentWatcher = this.parentWatcher = new Watcher(
        parent,
        parentKey,
        function (val) {
          child[childKey] = val;
        }
      );

      defineReactive(child, childKey, parentWatcher.value);
    }
  };

  var dirDef = {
    on: dirOn,
    text: dirText,
    model: dirModel,
    component,
    prop,
  };

  function compileAndLinkProps(vm, el, props) {
    const originalDirs = vm._directives.slice();
    const propsLinkFn = compileProps(el, props);
    propsLinkFn && propsLinkFn(vm);

    vm._directives.slice(originalDirs.length).forEach(d => d._bind());
    vm._directives = originalDirs;
  }

  function compileProps(el, optionProps, vm) {
    const props = [];
    const names = optionProps;
    let i = names.length;
    let name, path;
    while(i--) {
      name = names[i];
      path = el.getAttribute(`v-bind:${name}`) || el.getAttribute(`:${name}`);
      props.push({
        name,
        path
      });
    }
    return makePropsLinkFn(props);
  }

  function makePropsLinkFn(props) {
    return function propsLinkFn (vm) {
      let i = props.length;
      let prop;
      while(i--) {
        prop = props[i];
        vm._bindDir({
          name: 'prop',
          def: dirDef.prop,
          prop,
        });
      }
    }
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

    Vue.prototype._initProps = function () {
      const { props, el } = this.$options;
      if (props) {
        compileAndLinkProps(this, el, props);
      }
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

  const dirAttrReg = /^v-([^:]+)(?:$|:(.*)$)/;

  function compile(el, options) {
    // compile html tags, return a link function
    if (el.hasChildNodes()) {
      return function (vm) {
        const nodeLink = compileNode(el, options);
        const childLink = compileNodeList(el.childNodes, options);
        nodeLink && nodeLink(vm);
        childLink(vm);
        vm._directives.forEach(d => d._bind());
      }
    } else {
      return function (vm) {
        const nodeLink = compileNode(el, options);
        nodeLink && nodeLink(vm);
        vm._directives.forEach(d => d._bind());
      }
    }
  }

  function compileNode(el, options) {
    let linkFn;

    linkFn = checkComponent(el, options);

    if (!linkFn) {
      linkFn = compileDirective(el, el.attributes);
    }
    
    return linkFn;
  }

  function compileNodeList(nodeList, options) {
    const links = [];
    for (let i = 0; i < nodeList.length; i++) {
      const el = nodeList[i];
      let link = compileNode(el, options);
      link && links.push(link);
      if (el.hasChildNodes()) {
        link = compileNodeList(el.childNodes, options);
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

  function checkComponent(el, options) {
    const components = options.components || {};
    const tagName = (el.tagName || '').toLowerCase();
    if (components[tagName]) {
      const descriptor = {
        name: 'component',
        def: dirDef.component,
        expression: tagName,
        modifier: {
          literal: true
        }
      };

      return function componentLinkFn (vm) {
        vm._bindDir(descriptor, el);
      }
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
    constructor(descriptor, vm, el) {
      this.descriptor = descriptor;
      this.vm = vm;
      this.el = el;
      this.expression = descriptor.expression;
      this.literal = descriptor.modifier && descriptor.modifier.literal;
    }
    _bind() {
      const def = this.descriptor.def;

      extend(this, def);

      if (this.bind) {
        this.bind();
      }

      if (this.literal) {
        // skip updating 
        return;
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
        this._update(watcher.value);
      }
    }
  }

  function transclude(el, options) {
    if (options.template) {
      return parseTemplate(options.template);
    }
    return el;
  }

  function parseTemplate(templateString) {
    const node = document.createElement('div');
    node.innerHTML = templateString;
    return node.firstChild;
  }

  function lifecycleMixin (Vue) {
    Vue.prototype._compile = function (el, options) {
      const original = el;
      el = transclude(el, options);
      this.$el = el;
      const linkFn = compile(el, options);
      linkFn(this);

      if (options.replace) {
        options.parent.$el.replaceChild(el, original);
      }
    };

    Vue.prototype._bindDir = function (descriptor, el) {
      this._directives.push(new Directive(descriptor, this, el));
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
      this._directives = [];
      
      this.$options = options;
      this._context = options.parent;

      let el = options.el;
      if (typeof el === 'string') {
        el = document.querySelector(options.el);
      }

      for (let k in options.methods) {
        this[k] = options.methods[k];
      }

      // data reactivity
      this._initProps();
      this._initState();
      this._initComputed();
      this._initEvent();

      this._compile(el, options);
    }
  }

  stateMixin(Vue);
  eventMixin(Vue);
  lifecycleMixin(Vue);
  miscMixin(Vue);

  return Vue;

})));
