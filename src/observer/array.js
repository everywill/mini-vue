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

export default function modifyProto(arr) {
  mutatorMethods.forEach(function (method) {
    arr[method] = function (...args) {
      proto[method].apply(this, args);
      const ob = this.__ob__;
      ob.dep.notify();
    }
  });
}