import BehaviorModule from './behavior';

import ChoreoElementFactory from './ChoreoElementFactory';
import ChoreoUpdater from './ChoreoUpdater';
import ChoreoModeling from './ChoreoModeling';

export default {
  __init__: [
    'elementFactory',
    'bpmnUpdater',
    'modeling'
  ],
  __depends__: [
    BehaviorModule
  ],
  elementFactory: [ 'type', ChoreoElementFactory ],
  bpmnUpdater: [ 'type', ChoreoUpdater ],
  modeling: [ 'type', ChoreoModeling ]
};
