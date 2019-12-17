import Vue from '../../core/instance/vue';
import { compileToFunction } from '../../compiler/index';
import { mountComponent } from '../../core/instance/lifecycle';
import { patch } from './patch';

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
}

export default Vue;