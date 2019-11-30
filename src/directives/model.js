export default {
  bind() {
    const el = this.descriptor.el;
    el.addEventListener('input', () => {
      this.vm[this.expression] = el.value;
    })
  },
  update(value) {
    const el = this.descriptor.el;
    el.value = value;
  }
};