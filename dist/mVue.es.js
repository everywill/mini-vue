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
    const propsOptions = this.$options.props || [];
    const propsData = this.$options.propsData;
    let propKey;
    for (let i = 0, l = propsOptions.length; i < l; i++) {
      propKey = propsOptions[i];
      defineReactive(this, propKey, propsData[propKey]);
    }
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
    this._vnode = vnode;
    if (prevVnode) {
      this.$el = this.__patch__(prevVnode, vnode);
    } else {
      this.$el = this.__patch__(this.$el, vnode);
    }
  };
}

function mountComponent(vm, el) {
  const updateComponent = () => {
    vm._update(vm._render());
  };

  new Watcher(vm, updateComponent);

  return vm.$el;
}

const TEXT_ELEMENT = 'TEXT ELEMENT';

function createElement(type, config, ...args) {
  const data = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  data.children = rawChildren;

  if (this) {
    // context exists
    const regComponents = this.$options.components || {};
    if (regComponents.hasOwnProperty(type)) {
      return createComponent(regComponents[type], data, this);
    }
  }
  
  return { type, data, context: this };
}

function createComponent(Ctor, data, context) {
  const propsData = {};
  const propsOptions = Ctor.options.props || [];
  const { attrs = {} } = data;
  let propKey;
  for (let i = 0, l = propsOptions.length; i < l; i++) {
    propKey = propsOptions[i];
    if (attrs.hasOwnProperty(propKey)) {
      propsData[propKey] = attrs[propKey];
    } else {
      propsData[propKey] = '';
    }
  }

  return {
    type: Ctor,
    data: Object.assign({}, data, { propsData, parent: context }),
  }
}

function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { value });
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

  Vue.extend = function (extendOptions = {}) {
    const cls = class extends Vue {
      constructor(options) {
        options = Object.assign({}, options, extendOptions);
        super(options);
      }
    };

    cls.options = extendOptions;

    return cls;
  };
}

class Vue {
  constructor(options) {
    this.init(options);
  }

  init(options) {
    this.$options = options;
    this.$parent = options.parent;

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

function tagParser(tag, components) {
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

const domParserTokenizer = /<[a-zA-Z\-\!\/](?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])*>/g;

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
      if (regResult[1] === 'bind') {
        attrs.push({
          name: `${regResult[2]}`,
          value,
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

function compileToFunction (htmlString, options) {
  const elements = parse(htmlString, options);
  return genCode(elements[0]);
}

const hooks = ['create', 'update'];

function createPatch ({nodeOps, modules}) {
  const cbs = {};

  for (let i = 0, l = hooks.length; i < l; i++) {
    let hoolCb = cbs[hooks[i]] = [];
    for (let j = 0, k = modules.length; j < k; j++) {
      const moduleHook = modules[j][hooks[i]];
      if (moduleHook) {
        hoolCb.push(moduleHook);
      }
    }
  }

  function createElm(vnode, parentElm, refElm) {
    const { type, data } = vnode;
    if (typeof type === 'function') {
      vnode.componentInstance = new type({ ...data });
      vnode.elm = vnode.componentInstance.$mount();
    } else if (type === TEXT_ELEMENT) {
      vnode.elm = nodeOps.createTextNode(data.value);
    } else {
      const { children } = data;
      vnode.elm = nodeOps.createElement(type);
      createChildren(vnode, children);
      invokeCreateHooks(vnode);
    }
    insert(parentElm, vnode.elm, refElm);
  }

  function createChildren(vnode, children) {
    for (let i = 0, l = children.length; i < l; i++) {
      createElm(children[i], vnode.elm);
    }
  }

  function invokeCreateHooks(vnode) {
    for (let i = 0, l = cbs.create.length; i < l; i++) {
      cbs.create[i]({}, vnode);
    }
  }

  function invokeUpdateHooks(oldVnode, vnode) {
    for (let i = 0, l = cbs.update.length; i < l; i++) {
      cbs.update[i](oldVnode, vnode);
    }
  }

  function insert(parent, elm, refElm) {
    if (refElm) {
      nodeOps.insertBefore(parent, elm, refElm);
    } else {
      nodeOps.appendChild(parent, elm);
    }
  }

  function patchVnode(oldVnode, vnode) {
    if (oldVnode === vnode) {
      return;
    }

    const elm = vnode.elm = oldVnode.elm;
    
    if (oldVnode.componentInstance) {
      vnode.componentInstance = updateChildComponent(oldVnode.componentInstance, vnode.data);
    }

    invokeUpdateHooks(oldVnode, vnode);

    const oldChildren = oldVnode.data.children;
    const children = vnode.data.children;

    updateChildren(elm, oldChildren, children);
  }

  function updateChildComponent(componentInstance, options) {
    const { propsData } = options;
    for (let key in propsData) {
      componentInstance[key] = propsData[key];
    }

    return componentInstance;
  }

  function updateChildren(elm, oldChildren, children) {
    for (let i = 0, l = children.length; i < l; i++){
      patchVnode(oldChildren[i], children[i]);
    }
    for (let i = children.length, l = oldChildren.length; i < l; i++) {
      patchVnode(oldChildren[i], children[i]);
    }
  }

  return function patch (oldVnode, vnode, contextParent) {
    let parentElm = contextParent;
    if (!vnode) {
      if (oldVnode) {
        parentElm = nodeOps.parentNode(oldVnode);
        nodeOps.removeChild(parentElm, oldVnode.elm);
      }
      return;
    }

    if (!oldVnode) {
      createElm(vnode, contextParent || this.$parent.$el);
    } else {
      const isRealElement = !!oldVnode.nodeType;
      if (isRealElement) {
        parentElm = nodeOps.parentNode(oldVnode);
        createElm(vnode, parentElm, nodeOps.nextSibling(oldVnode));
        nodeOps.removeChild(parentElm, oldVnode);
      } else if (!isRealElement && vnode.type === oldVnode.type) {
        patchVnode(oldVnode, vnode);
      }
    }

    return vnode.elm;
  };
}

function createElement$1(tagName) {
  return document.createElement(tagName);
}
function createTextNode(content) {
  return document.createTextNode(content);
}
function parentNode(node) {
  return node.parentNode;
}
function nextSibling(node) {
  return node.nextSibling;
}
function tagName(node) {
  return node.tagName;
}

function removeChild(parent, child) {
  parent.removeChild(child);
}
function appendChild(parent, child) {
  parent.appendChild(child);
}
function insertBefore(parent, child, refChild) {
  parent.insertBefore(child, refChild);
}

var nodeOps = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createElement: createElement$1,
  createTextNode: createTextNode,
  parentNode: parentNode,
  nextSibling: nextSibling,
  tagName: tagName,
  removeChild: removeChild,
  appendChild: appendChild,
  insertBefore: insertBefore
});

var baseModules = [];

var events = {
  create: updateDomListener,
  update: updateDomListener,
};

let _target;

function updateDomListener(oldVnode, vnode) {
  const elm = vnode.elm;
  const { children: oldChildren, ...oldAttrs } = oldVnode.data || {};
  const { children, ...attrs } = vnode.data;
  const ons = attrs.on || {};
  const oldOns = oldAttrs.on || {};
  let cur, old;

  _target = vnode.elm;

  for(let name in ons) {
    cur = ons[name];
    old = oldOns[name];

    if (!old) {
      cur = ons[name] = createFnInvoker(cur, vnode.context);
      _target.addEventListener(name, cur);
    } else if (cur !== old) {
      old.fn = cur;
      cur[name] = old;
    }
  }

  for(let name in oldOns) {
    if (!ons[name]) {
      _target.removeEventListener(name, oldOns[name]);
    }
  }

  _target = undefined;
}

function createFnInvoker(fn, vm) {
  function invoker(...args) {
    return fn.apply(vm, ...args);
  }

  invoker.fn = fn;
  return invoker;
}

var domProps = {
  create: updateDomProps,
  update: updateDomProps,
};

function updateDomProps(oldVnode, vnode) {
  const elm = vnode.elm;
  const { children: oldChildren, ...oldAttrs } = oldVnode.data || {};
  const { children, ...attrs } = vnode.data;
  const domProps = attrs.domProps || {};
  const oldDomProps = oldAttrs.domProps || {};

  for (let key in oldDomProps) {
    if (domProps.hasOwnProperty(key)) {
      elm[key] = null;
    }
  }

  for (let key in domProps) {
    elm[key] = domProps[key];
  }
}

var platformModules = [
  events,
  domProps,
];

const modules = baseModules.concat(platformModules);

const patch = createPatch({nodeOps, modules});

Vue.prototype.__patch__ = patch;

Vue.prototype.$mount = function (el) {
  if (typeof el === 'string') {
    el = document.querySelector(el);
  }

  this.$el = el;

  const options = this.$options;
  if (!options.render) {
    let template = options.template;
    // only take into account the situation template is kind of html string
    if (!template) {
      template = el.outerHTML;
    }

    options.render = compileToFunction(template, options);
  }

  return mountComponent(this);
};

export default Vue;
