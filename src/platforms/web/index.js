import Vue from '../../core/instance/vue';
import { compileToFunction } from '../../compiler/index';
import { mountComponent } from '../../core/instance/lifecycle';

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

  return mountComponent(this, el);
}

export default Vue;