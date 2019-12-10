# mini-vue

v1.0 is based on data reactivity and directives, the latter come from compiling and perform view-manipulation. Watchers play the role connectting them together.

Basic usages are supported, for example:

```
// html
<div id="app">
  <button @click="plusOne">+1</button>
  <p v-text="number"></p>
  <p v-text="a"></p>
  <my-component :propsA="a"></my-component>
</div>

// javascript
const myComponent = mVue.extend({
  template: '<div v-text="propsA"></div>',
  props: ['propsA'],
  methods: {
    minusOne() {
      this.componentNumber = this.componentNumber -1;
    }
  }
})

new mVue({
  el: '#app',
  components: {
    'my-component': myComponent,
  },
  data: {
    number: [1,2],
    a: 1
  },
  computed: {
    sum: function() {
      return this.number[0] + this.a;
    }
  },
  watch: {
    a: function() {
      console.log('a has been changed');
    }
  },
  methods: {
    plusOne() {
      this.number.push(this.number.length);
      this.a = this.a + 1;
    }
  }
});
```
