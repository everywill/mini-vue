export default {
  update(value) {
    const el = this.descriptor.el;
    el.style.display = value ? '' : none;
  }
};