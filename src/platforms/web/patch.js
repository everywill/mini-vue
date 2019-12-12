import createPatch from '../../core/vdom/patch';
import nodeOps from './runtime/node-ops';

export const patch = createPatch({nodeOps});
