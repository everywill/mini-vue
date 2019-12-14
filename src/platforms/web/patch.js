import createPatch from '../../core/vdom/patch';
import * as nodeOps from './runtime/node-ops';
import baseModules from '../../core/vdom/modules/index';
import platformModules from './runtime/modules/index';

const modules = baseModules.concat(platformModules);

export const patch = createPatch({nodeOps, modules});
