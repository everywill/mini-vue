export default {
  update(value) {
    const el = this.descriptor.el;
    el.textContent = value;
  }
};