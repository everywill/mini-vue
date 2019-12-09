export default {
  bind() {
    this.setComponent(this.expression)
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